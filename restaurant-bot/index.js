require("dotenv").config();
const path = require("path");
const express = require("express");
const { BotFrameworkAdapter } = require("botbuilder");
const { RestaurantBot } = require("./bot/restaurantBot");

const app = express();
const PORT = process.env.PORT || 3978;

const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID || "",
  appPassword: process.env.MICROSOFT_APP_PASSWORD || "",
});

adapter.onTurnError = async (context, error) => {
  console.error(`[onTurnError] ${error}`);
  await context.sendActivity("Oops. Something went wrong!");
};

const bot = new RestaurantBot();

app.post("/api/messages", express.json(), (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    await bot.run(context);
  });
});

app.listen(PORT, () => {
  console.log(`Bot server listening at http://localhost:${PORT}/api/messages`);
});
