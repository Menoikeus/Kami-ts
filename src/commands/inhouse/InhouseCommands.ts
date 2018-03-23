import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../services/CommandService';
import InhouseService from '../../services/InhouseService';
import RiotApiService from '../../services/RiotApiService';

export class AddSummoner extends Command {
  constructor() {
    super(["inhouse", "add"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Check for a valid argument
    if(args.length != 1) throw new Error("You should only provide me your " +
      "summoner name! If there's a space, wrap it in quotes!");
    if(args[0].trim().length == 0) throw new Error("I need a summoner name to link to your account!");

    const userid: string = message.member.user.id;
    const guildid: string = message.guild.id;

    // Get user by discord id
    const user = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);

    // Get summoner
    const summoner = await RiotApiService.getSummonerByName(args[0]);

    // Get inhouse profile linked to summoner, if there is one
    const existingInhouseProfile = await InhouseService.getInhouseProfileByLeagueId(summoner.id, guildid);

    // If the user already has an inhouse account
    if(user) {
      // If they have a summoner already linked...
      if(user.leagueid !== undefined) {

      }
      else {
        InhouseService.getInhouseProfileCollection(guildid).update(
          { userid: userid },
          { $set: { leagueid: summoner.id } }
        ).then(() => {
          message.channel.send("I've successfully linked your account with summoner " + summoner.name);
        });
      }
    }
  }
}
