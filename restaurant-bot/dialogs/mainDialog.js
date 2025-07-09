const fs = require("fs");
const path = require("path");
const {
  ComponentDialog,
  WaterfallDialog,
  TextPrompt,
} = require("botbuilder-dialogs");

const MAIN_DIALOG = "mainDialog";
const WATERFALL_DIALOG = "waterfallDialog";
const TEXT_PROMPT = "textPrompt";

class MainDialog extends ComponentDialog {
  constructor() {
    super(MAIN_DIALOG);

    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.routeUserIntent.bind(this),
      ])
    );

    this.initialDialogId = WATERFALL_DIALOG;

    const restaurantPath = path.join(__dirname, "../data/restaurants.json");
    this.restaurants = JSON.parse(fs.readFileSync(restaurantPath, "utf8"));

    const menuPath = path.join(__dirname, "../data/menus.json");
    this.menus = JSON.parse(fs.readFileSync(menuPath, "utf8"));

    this.carts = {};
    this.orderStatus = {};
    this.orderPayments = {};
    this.reservations = {}; // Store user reservations
    this.promptedUsers = new Set();
  }

  async initialStep(step) {
    return await step.next(step.context.activity.text); // Skip prompting
  }

  async routeUserIntent(step) {
    const input = step.result.toLowerCase();
    const userId = step.context.activity.from.id;

    // === Restaurant Discovery ===
    if (/restaurant[s]?/i.test(input)) {
      await step.context.sendActivity("🔍 Searching for restaurants...");
      const matches = this.restaurants.map(
        (r) =>
          `🍽️ ${r.name} — ${r.cuisine}, ${r.location}, ${r.priceRange}, ⭐ ${r.rating}`
      );
      await step.context.sendActivity(matches.join("\n\n"));
    }

    // === Show Menu ===
    else if (input.includes("menu")) {
      const restaurantNames = Object.keys(this.menus);
      const matched = restaurantNames.find((r) =>
        input.includes(r.toLowerCase())
      );

      if (matched) {
        const items = this.menus[matched]
          .map((item) => `🍽️ ${item.name} — ₹${item.price}`)
          .join("\n");
        await step.context.sendActivity(
          `📋 Menu for *${matched}*:\n\n${items}`
        );
      } else {
        await step.context.sendActivity(
          "❓ Please specify a valid restaurant name."
        );
      }
    }

    // === Cancel Reservation ===
    else if (
      input.includes("cancel reservation") ||
      input.includes("cancel my reservation")
    ) {
      const matchedRestaurant = Object.keys(this.menus).find((r) =>
        input.includes(r.toLowerCase())
      );

      const guestsMatch = input.match(
        /for\s+(\d+)\s*(people|persons|guests)?/i
      );
      const timeMatch = input.match(/at\s+(\d{1,2})(:\d{2})?\s*(am|pm)?/i);

      const guests = guestsMatch ? guestsMatch[1] : null;
      const time = timeMatch
        ? `${timeMatch[1]}${timeMatch[2] || ""} ${timeMatch[3] || ""}`.trim()
        : null;

      const userReservations = this.reservations[userId] || [];

      if (!matchedRestaurant || !guests || !time) {
        await step.context.sendActivity(
          "❓ Please specify restaurant name, number of guests and time (e.g., 'Cancel my reservation at Pasta Palace for 2 at 8 PM')."
        );
      } else {
        const updated = userReservations.filter(
          (r) =>
            !(
              r.restaurant === matchedRestaurant &&
              r.guests === guests &&
              r.time === time
            )
        );

        if (updated.length < userReservations.length) {
          this.reservations[userId] = updated;
          await step.context.sendActivity(
            `❌ Reservation at *${matchedRestaurant}* for *${guests}* at *${time}* has been cancelled.`
          );
        } else {
          await step.context.sendActivity(
            `😕 No matching reservation found for *${matchedRestaurant}* at *${time}* for *${guests}* guests.`
          );
        }
      }
    }

    // === Modify Reservation ===
    else if (input.includes("change reservation")) {
      const matchedRestaurant = Object.keys(this.menus).find((r) =>
        input.includes(r.toLowerCase())
      );

      const timeMatch = input.match(/to\s+(\d{1,2})(:\d{2})?\s*(am|pm)?/i);
      const guestsMatch = input.match(/to\s+(\d+)\s*(people|guests)?/i);

      if (!matchedRestaurant || !this.reservations[userId]) {
        await step.context.sendActivity(
          "❓ Please mention a valid reservation to modify."
        );
      } else {
        let updated = false;

        this.reservations[userId] = this.reservations[userId].map((r) => {
          if (r.restaurant === matchedRestaurant) {
            if (timeMatch) {
              r.time = `${timeMatch[1]}${timeMatch[2] || ""} ${
                timeMatch[3] || ""
              }`.trim();
              updated = true;
            }
            if (guestsMatch) {
              r.guests = guestsMatch[1];
              updated = true;
            }
          }
          return r;
        });

        if (updated) {
          await step.context.sendActivity(
            `🔄 Reservation at *${matchedRestaurant}* updated successfully.`
          );
        } else {
          await step.context.sendActivity(
            `😕 Could not find or update your reservation.`
          );
        }
      }
    }

    // === Book Table ===
    else if (
      (input.includes("book") || input.includes("reservation")) &&
      !input.includes("cancel") &&
      !input.includes("change")
    ) {
      const restaurantNames = Object.keys(this.menus);
      const matchedRestaurant = restaurantNames.find((r) =>
        input.includes(r.toLowerCase())
      );

      const guestsMatch = input.match(/(\d+)\s*(people|persons|guests)?/i);
      const timeMatch = input.match(/at\s+(\d{1,2})(:\d{2})?\s*(am|pm)?/i);

      if (!matchedRestaurant) {
        await step.context.sendActivity(
          "❓ Please specify a valid restaurant name."
        );
      } else if (!guestsMatch || !timeMatch) {
        await step.context.sendActivity(
          "❓ Please specify number of guests and a time (e.g., 2 people at 7 PM)."
        );
      } else {
        const guests = guestsMatch[1];
        const time = `${timeMatch[1]}${timeMatch[2] || ""} ${
          timeMatch[3] || ""
        }`.trim();

        if (!this.reservations[userId]) this.reservations[userId] = [];

        this.reservations[userId].push({
          restaurant: matchedRestaurant,
          guests,
          time,
        });

        await step.context.sendActivity(
          `📅 Table booked at *${matchedRestaurant}* for *${guests}* people at *${time}*.`
        );
      }
    }

    // === Confirm Order ===
    else if (input.includes("confirm order")) {
      const cart = this.carts[userId] || [];
      if (cart.length === 0) {
        await step.context.sendActivity(
          "🛒 Your cart is empty. Add items before confirming."
        );
      } else {
        this.orderStatus[userId] = "Preparing";
        this.orderPayments[userId] = cart.reduce(
          (sum, item) => sum + item.price,
          0
        );
        this.carts[userId] = [];
        await step.context.sendActivity(
          "✅ Your order has been placed! 🎉 It will be ready shortly."
        );
        await step.context.sendActivity("⏱️ Estimated delivery: 45 minutes.");
      }
    }

    // === Payment ===
    else if (input.includes("pay with")) {
      const method = input.includes("card")
        ? "Card"
        : input.includes("upi")
        ? "UPI"
        : input.includes("cash")
        ? "Cash on Delivery"
        : null;

      if (!method) {
        await step.context.sendActivity(
          "❓ Please specify a valid payment method: card, UPI, or cash."
        );
        return await step.endDialog();
      }

      const total = this.orderPayments[userId];

      if (!total) {
        await step.context.sendActivity(
          "🛒 Your cart is empty. Add something before paying."
        );
        return await step.endDialog();
      }

      delete this.orderPayments[userId];

      await step.context.sendActivity(
        `💳 Payment of ₹${total} received via *${method}*.`
      );
      await step.context.sendActivity(
        "✅ Order confirmed and being processed. Thank you!"
      );
    }

    // === Order Tracking ===
    else if (
      input.includes("where is my order") ||
      input.includes("track order")
    ) {
      const currentStatus = this.orderStatus[userId];
      if (!currentStatus) {
        await step.context.sendActivity("❌ No order found to track.");
      } else {
        const nextStatus = {
          Preparing: "Ready for pickup",
          "Ready for pickup": "Out for delivery",
          "Out for delivery": "Delivered",
        };

        const updatedStatus = nextStatus[currentStatus] || currentStatus;
        this.orderStatus[userId] = updatedStatus;
        await step.context.sendActivity(
          `📦 Current order status: ${currentStatus} ➡️ Updated to: ${updatedStatus}`
        );
      }
    }

    // === Order Item ===
    else if (input.includes("order")) {
      const restaurantNames = Object.keys(this.menus);
      const matchedRestaurant = restaurantNames.find((r) =>
        input.includes(r.toLowerCase())
      );

      if (!matchedRestaurant) {
        await step.context.sendActivity(
          "❌ Please include a valid restaurant name in your order."
        );
        return await step.endDialog();
      }

      const menuItems = this.menus[matchedRestaurant];
      const matchedItem = menuItems.find((item) =>
        input.includes(item.name.toLowerCase())
      );

      if (!matchedItem) {
        await step.context.sendActivity(
          `❌ Couldn't find that item on the menu of ${matchedRestaurant}.`
        );
        return await step.endDialog();
      }

      if (!this.carts[userId]) this.carts[userId] = [];

      this.carts[userId].push({
        restaurant: matchedRestaurant,
        item: matchedItem.name,
        price: matchedItem.price,
      });

      await step.context.sendActivity(
        `✅ Added *${matchedItem.name}* from *${matchedRestaurant}* to your cart.`
      );
    }

    // === Show Cart ===
    else if (input.includes("show cart")) {
      const cart = this.carts[userId] || [];
      if (cart.length === 0) {
        await step.context.sendActivity("🛒 Your cart is empty.");
      } else {
        let total = 0;
        const lines = cart.map((c) => {
          total += c.price;
          return `🍴 ${c.item} from ${c.restaurant} — ₹${c.price}`;
        });
        lines.push(`\n💰 **Total: ₹${total}**`);
        await step.context.sendActivity(lines.join("\n"));
      }
    }

    // === Fallback ===
    else {
      await step.context.sendActivity(
        '🤖 Sorry, I didn\'t understand that. Try:\n- "Order Garlic Naan from Spice Garden"\n- "Show menu for Sushi World"\n- "Book a table at Pizza Palace for 4 at 8 pm"'
      );
    }

    return await step.endDialog();
  }
}

module.exports.MainDialog = MainDialog;
