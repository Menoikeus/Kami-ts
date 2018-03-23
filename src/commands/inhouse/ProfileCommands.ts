import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../services/CommandService';

export class GetProfile extends Command {
  constructor() {
    super(["inhouse", "profile"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    message.channel.send("Hello! " + args[0]);
  }
}
