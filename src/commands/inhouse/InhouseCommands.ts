import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../services/CommandService';
import InhouseService from '../../services/InhouseService';
import RiotApiService from '../../services/RiotApiService';
import InfoService from '../../services/InfoService';

export class AddSummoner extends Command {
  constructor() {
    super(["inhouse", "add"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Check for a valid argument
    if(args.length != 1) throw new Error("You should only provide me your " +
      "summoner name! If there's a space, wrap it in quotes!");
    if(args[0].trim().length == 0) throw new Error("I need a summoner name to link to your account!");

    // Create and assign summoner to account
    const result = await InhouseService.updateInhouseProfile(message.member.user.id, message.guild.id, args[0]);
    message.channel.send(result);
  }
}
