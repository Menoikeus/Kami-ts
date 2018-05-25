import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../services/CommandService';
import OutputService from '../../services/OutputService';
import InhouseService from '../../services/InhouseService';
import StatisticsService from '../../services/StatisticsService';

export class GetProfile extends Command {
  constructor() {
    super(["inhouse", "profile"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    let guildid: string = message.guild.id;

    // We need either nothing or a discord id
    if(args.length > 1) throw new Error("Either run the command without arguments or give me a discord username! Use quotes for names with spaces.");

    let userid: string;
    if(args.length === 0) {
      userid = message.member.id;
    }
    else if(args.length === 1) {
      userid = await OutputService.getUserIdByUsername(args[0], message.guild.id);
    }

    let inhousePlayer = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);
    if(!inhousePlayer) throw new Error((args.length === 0 ? "You're" : "They're") + " not in the inhouse league yet! Add a summoner with !inhouse add.");

    let output = await OutputService.outputInhouseProfile(inhousePlayer, guildid);

    message.channel.send({embed: output});
  }
}
