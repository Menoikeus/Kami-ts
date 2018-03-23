import { Client, Message } from 'discord.js';
import { CommandHandler } from './services/CommandService';
import AllCommands from './commands/AllCommands';
import { MongoDatabaseProvider } from './services/MongoDBService';
import { MongoClient } from 'mongodb';
const config = require('./config/global_config.json');
const mongodb_config = require('./config/mongodb/mongo_config.json');
const path = require('path');

export class Bot {
  private client: Client;
  private commandHandler: CommandHandler;

  constructor(token: string) {
    // Create a new client and command handler
    this.client = new Client();
    this.commandHandler = new CommandHandler(this.client);

    // When the bot is ready, and when it encounters an error
    this.client.on('ready', () => {
      console.log("I am ready!");
      this.client.user.setActivity("videogames");
    });
    this.client.on('error', console.error);

    // Setup the database, then setup commands, then login with the token
    this.setupDatabase().then(() => {
      this.setupCommands();
    }).then(() => {
      this.client.login(token);
    });
  }

  private setupDatabase(): Promise<MongoClient> {
    return MongoDatabaseProvider.connectToDatabase(mongodb_config.user, mongodb_config.password, mongodb_config.url);
  }

  private setupCommands(): void {
    this.commandHandler.addCommands(new AllCommands());

    console.log("Commands added!");
    // On each message, check to see if it's a command. If so, find and run the command
    this.client.on('message', async (message: Message) => {
      if(message.author.bot) return;
      let db: MongoClient = MongoDatabaseProvider.getDatabase();

      // Get the prefix for the server
      const directoryInfo = await db.db(message.guild.id).collection("info").findOne({ info_type: "directory_info" });
      const server_prefix: string = directoryInfo.s_prefix;

      if(!message.content.startsWith(server_prefix)) return;
      // Run the command, and catch errors

      this.commandHandler.findAndRun(message, server_prefix).catch((error) => {
        console.log("CAUGHT");
        message.channel.send(error.message);
      });
    });
  }
}
