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
                      " Please link your accounts with summoners using !inhouse add USERNAME.");
    }

    // See if the teams are balanced enough
    let team100 = 0;
    let team200 = 0;
    game.participants.map((p) => { p.teamId == 100 ? team100++ : team200++  });
    if(Math.abs(team100 - team200) > (inhouseInfo.i_max_imbalance || 1)) {
      throw new Error("Your game is currently too imbalanced. Balance the game or change the server's max imbalance value");
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
      match = (await InhouseService.getInhouseMatchesCollection(guildid).find().limit(1).sort({date:-1}).toArray())[0];
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

export class ShowMatches extends Command {
  constructor() {
    super(["inhouse", "games"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Check for a valid argument
    if(!(args.length === 0 || args.length === 1)) throw new Error("This command should take a page number!");
    if(args[0] && isNaN(Number(args[0]))) throw new Error("The argument should be a number!");

    let pageNumber: number = Number(args[0]) || 1;
    if(pageNumber < 1) throw new Error("The page number should be a number greater than or equal to 1!");

    // Get 3 matches on the specified page
    const matchesPerPage: number = 5;
    const guildid: string = message.guild.id;
    let matches = await InhouseService.getInhouseMatchesCollection(guildid)
      .find({ completed: true })
      .limit(matchesPerPage)
      .sort({ date: -1 })
      .skip(matchesPerPage * (pageNumber - 1))
      .toArray();

    let output = await OutputService.outputMatchList(matches);
    output.footer = {
      "text": "Page " + pageNumber,
    };

    message.channel.send({ embed: output });
  }
}
