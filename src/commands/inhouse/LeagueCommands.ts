import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../services/CommandService';

export class GetLeague extends Command {
  constructor() {
    super(["inhouse", "league"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    message.channel.send("Hello! " + args.join(" "));
  }
}
