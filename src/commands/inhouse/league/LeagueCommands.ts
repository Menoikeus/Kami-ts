import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../../services/CommandService';

class GetLeague implements Command {
  caller: string[];

  constructor() {
    this.caller = ["inhouse", "league"];
  };

  public run(client: Client, message: Message, args: string[]): void {
    message.channel.send("Hello! " + args.join(" "));
  }
}

export class LeagueCommands implements CommandList {
  commands: Command[];

  constructor() {
    this.commands = [];
    this.commands.push(new GetLeague());
  }
};
