const {
  ActivityHandler,
  ConversationState,
  MemoryStorage,
  UserState,
} = require("botbuilder");
const { DialogSet, DialogTurnStatus } = require("botbuilder-dialogs");
const { MainDialog } = require("../dialogs/mainDialog");

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const DIALOG_STATE_PROPERTY = "dialogState";

class RestaurantBot extends ActivityHandler {
  constructor() {
    super();
    this.conversationState = conversationState;
    this.userState = userState;

    this.dialogState = this.conversationState.createProperty(
      DIALOG_STATE_PROPERTY
    );
    this.dialogs = new DialogSet(this.dialogState);
    this.dialogs.add(new MainDialog());

    this.onMessage(async (context, next) => {
      const dialogContext = await this.dialogs.createContext(context);
      const result = await dialogContext.continueDialog();

      if (result.status === DialogTurnStatus.empty) {
        await dialogContext.beginDialog("mainDialog");
      }

      await next();
    });

    this.onMembersAdded(async (context, next) => {
      for (let member of context.activity.membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            "Welcome to the Restaurant Bot! 🍽️\nYou can say things like:\n- Find restaurants\n- Show menu for Sushi World\n- I want to order\n- Book a table"
          );
        }
      }
      await next();
    });
  }

  async run(context) {
    await super.run(context);
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }
}

module.exports.RestaurantBot = RestaurantBot;
