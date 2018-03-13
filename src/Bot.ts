import { Client, Message } from 'discord.js';
import { CommandHandler } from './services/CommandService';
import { LeagueCommands } from './commands/inhouse/league/LeagueCommands';
import { ProfileCommands } from './commands/inhouse/profile/ProfileCommands';
import { MongoDatabaseProvider } from './services/MongoDBService';
import { MongoClient } from 'mongodb';
const config = require('./config/global_config.json');
const mongodb_config = require('./config/mongodb/mongo_config.json');
const path = require('path');

export class Bot {
  private client: Client;
  private commandHandler;

  constructor(token: string) {
    this.client = new Client();
    this.commandHandler = new CommandHandler(this.client);

    this.client.on('ready', () => {
      console.log("I am ready!");
      this.client.user.setActivity("videogames");
    });

    this.client.on('error', console.error);
    this.client.login(token);

    this.setupDatabase();
    setTimeout(this.setupCommands.bind(this), 1000);
  }

  private setupDatabase(): void {
    new MongoDatabaseProvider(mongodb_config.user, mongodb_config.password, mongodb_config.url);
  }

  private setupCommands(): void {
    this.commandHandler.addCommands(new LeagueCommands());
    this.commandHandler.addCommands(new ProfileCommands());

    console.log("Commands added!");
    let db: MongoClient = MongoDatabaseProvider.getDatabase();
    this.client.on('message', async (message: Message) => {
      if(message.author.bot) return;

      const directoryInfo = await db.db(message.guild.id).collection("info").findOne({ info_type: "directory_info" });
      const server_prefix: string = directoryInfo.s_prefix;

      if(!message.content.startsWith(server_prefix)) return;

      this.commandHandler.findAndRun(message, server_prefix);
    });
  }
}
