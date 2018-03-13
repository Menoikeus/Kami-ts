import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../../services/CommandService';

class GetProfile implements Command {
  caller: string[];

  constructor() {
    this.caller = ["inhouse", "profile"];
  };

  public run(client: Client, message: Message, args: string[]): void {
    message.channel.send("Hello! " + args[0]);
  }
}

export class ProfileCommands implements CommandList {
  commands: Command[];

  constructor() {
    this.commands = [];
    this.commands.push(new GetProfile());
  }
};
