import { CommandoClient } from 'discord.js-commando';
const config = require('./config/global_config.json');
const path = require('path');

export class Bot {
  private client: CommandoClient;

  constructor(ownerId: string, token: string) {
    this.client = new CommandoClient({
      owner: ownerId,
      commandPrefix: config.defaultPrefix
    });

    this.client.on('ready', () => {
      console.log("I am ready!");
      this.client.user.setActivity("videogames");
    });

    this.client.on('error', console.error);

    this.client.registry.registerGroups([
        ['inhouse', 'Inhouse commands'],
        ['general', 'General commands']
      ]);

    this.client.registry.registerDefaults();

    this.client.registry.registerCommandsIn(path.join(__dirname, 'commands/inhouse'));

    this.client.login(token);
  }
}
