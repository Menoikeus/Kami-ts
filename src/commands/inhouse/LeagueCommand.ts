import { Client, Message } from 'discord.js';
import { Command } from '../../services/CommandService';

export default class LeagueCommand implements Command {
  caller: string[];

  constructor() {
    this.caller = ["inhouse"];
  };

  public run(client: Client, message: Message, args: string[]): void {
    message.channel.send("Hello!");
  }
}
