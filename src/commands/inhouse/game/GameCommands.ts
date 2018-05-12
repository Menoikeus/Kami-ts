import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../../services/CommandService';
import InhouseService from '../../../services/InhouseService';
import RiotApiService from '../../../services/RiotApiService';
import InfoService from '../../../services/InfoService';

export class StartGame extends Command {
  constructor() {
    super(["inhouse", "game", "start"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Check for a valid argument
    if(args.length != 0) throw new Error("This command doesn't take in any arguments!");

    const userid: string = message.member.user.id;
    const guildid: string = message.guild.id;

    // Get the summoner's game
    let game = await RiotApiService.getCurrentGameByUserId(userid, guildid);

    // Check if its a custom game
    if(game.gameType != "CUSTOM_GAME") throw new Error("Inhouse games must be custom games!");

    // Get all inhouse players who have ids in the match, and check if there are enough players
    const inhousePlayers: Array<Object> = await InhouseService.getAllInhousePlayersInGame(game, guildid);
    const inhouseInfo = await InfoService.getInhouseInfo(guildid);
    if(inhousePlayers.length < inhouseInfo.i_minimum_players) {
      throw new Error("An inhouse game must have at least " + inhouseInfo.i_minimum_players +
                      " players in the inhouse league to be valid!" +
                      " Please link your accounts with summoners using !inhouse add $USERNAME");
    }


  }
}
