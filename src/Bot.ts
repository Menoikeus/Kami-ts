import { Client, Message, Guild, GuildMember } from 'discord.js';
import { CommandHandler } from './services/CommandService';
import AllCommands from './commands/AllCommands';
import { MongoDatabaseProvider } from './services/MongoDBService';
import { MongoClient } from 'mongodb';
import GuildService from './services/GuildService';
import ProfileService from './services/ProfileService';
import InfoService from './services/InfoService';
import MatchService from './services/MatchService';
import OutputService from './services/OutputService';

const config = require('../config/global_config.json');
const mongodb_config = require('../config/mongodb/mongo_config.json');
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
      this.client.login(token);
    }).then(() => {
      this.setupCommands();
    }).then(() => {
      setTimeout(() => {
        this.setupGuilds();
        MatchService.setupMatchService(this.client);
        OutputService.setupOutputService(this.client);
      }, 2000);
    });
  }

  private setupDatabase(): Promise<MongoClient> {
    return MongoDatabaseProvider.connectToDatabase(mongodb_config.user, mongodb_config.password, mongodb_config.url);
  }

  private setupCommands(): void {
    this.commandHandler.addCommands(new AllCommands());

    console.log("Commands added!");
    // On each message, check to see if it's a command. If so, find and run the command
    let db: MongoClient = MongoDatabaseProvider.getDatabase();
    this.client.on('message', async (message: Message) => {
      if(message.author.bot) return;

      // Get the prefix for the server
      const directoryInfo = await InfoService.getDirectoryInfo(message.guild.id);
      const server_prefix: string = directoryInfo.s_prefix;

      if(!message.content.startsWith(server_prefix)) return;
      // Run the command, and catch errors

      this.commandHandler.findAndRun(message, server_prefix).catch((error) => {
        message.channel.send(error.message);
      });
    });
  }

  private setupGuilds(): void {
    console.log("Adding guilds");
    this.client.guilds.forEach((guild: Guild) => {
      GuildService.addGuildToDatabase(guild);
      setTimeout(() => { this.createWatcher(guild.id); }, Math.floor(Math.random() * 180) * 1000);
    });

    this.client.on("guildCreate", (guild: Guild) => { GuildService.addGuildToDatabase(guild); this.createWatcher(guild.id); });
    this.client.on("guildMemberAdd", (member: GuildMember) => ProfileService.createProfileInServer(member.user.id, member.guild.id));
  }

  private createWatcher(guildid: string): void {
    MatchService.startMatchWatcher(this.client, guildid);
  }
}
