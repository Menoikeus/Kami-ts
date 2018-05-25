import { Client, Message, GuildMember } from 'discord.js';
import { Command, CommandList } from '../../../services/CommandService';
import InhouseService from '../../../services/InhouseService';
import RiotApiService from '../../../services/RiotApiService';
import InfoService from '../../../services/InfoService';
import MatchService from '../../../services/MatchService';
import OutputService from '../../../services/OutputService';

export class StartMatch extends Command {
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

    // Check if we're watching the game already
    let existingGame = await InhouseService.getInhouseMatchByMatchId(game.gameId, guildid);
    if(existingGame) throw new Error("The game you're in is already being watched!");

    // Check if its a custom game
    if(game.gameType != "CUSTOM_GAME") throw new Error("Inhouse games must be custom games!");

    // Get all inhouse players who have ids in the match, and check if there are enough players
    const inhousePlayers: Array<Object> = await InhouseService.getAllInhousePlayersInMatch(game, guildid);
    const inhouseInfo = await InfoService.getInhouseInfo(guildid);
    if(inhousePlayers.length < inhouseInfo.i_minimum_players) {
      throw new Error("An inhouse game must have at least " + inhouseInfo.i_minimum_players +
                      " players in the inhouse league to be valid!" +
                      " Please link your accounts with summoners using !inhouse add $USERNAME");
    }

    await MatchService.insertUnfinishedMatchIntoDatabase(game, guildid, message.channel.id);

    let players: Array<String> = [];
    inhousePlayers.forEach((player: any) => {
      let member: GuildMember = message.guild.members.get(player.userid);
      players.push(member.user.username);
    });

    message.channel.send(players.join(", ") + " " + (players.length === 1 ? "has" : "have") + " started a match with id " + game.gameId);
  }
}

export class ShowMatch extends Command {
  constructor() {
    super(["inhouse", "game"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    let guildid: string = message.guild.id;
    let match;

    // Check for a valid argument
    if(args.length !== 1) {
      throw new Error("You need to give me a match id, or the word 'recent'");
    }
    else if(args[0] === "recent") {
      match = (await InhouseService.getInhouseMatchesCollection(guildid).find().limit(1).sort({$natural:-1}).toArray())[0];
      if(!match) {
        throw new Error("There aren't any matches in the league.");
      }
    }
    else {
      match = await InhouseService.getInhouseMatchByMatchId(args[0], guildid);
      if(!match) {
        throw new Error("A match with that id does not exist!");
      }
    }

    let output = await OutputService.outputMatch(match);
    message.channel.send({ embed: output });
  }
}
