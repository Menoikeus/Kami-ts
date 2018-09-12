import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../services/CommandService';
import InhouseService from '../../services/InhouseService';
import RiotApiService from '../../services/RiotApiService';
import InfoService from '../../services/InfoService';
import OutputService from '../../services/OutputService';
import MatchService from '../../services/MatchService';

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
    const result: string = await InhouseService.updateInhouseProfile(message.member.user.id, message.guild.id, args[0]);
    message.channel.send(result);
  }
}

export class ReassignSummoner extends Command {
  constructor() {
    super(["inhouse", "reassign"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Check for a valid argument
    if(args.length === 0) throw new Error("You need to provide me your " +
      "summoner name! If there's a space, wrap it in quotes!");
    if(args.length !== 1) throw new Error("You should only provide me your " +
      "summoner name! If there's a space, wrap it in quotes!");
    if(args[0].trim().length == 0) throw new Error("I need a summoner name to assign to your account!");

    const userid = message.member.id;
    const guildid = message.guild.id;
    const summonerName = args[0].trim();

    await InhouseService.updateSummonerForProfile(client, summonerName, userid, guildid);
    message.channel.send("Your profile has been successfully reassigned to summoner " + summonerName);

    // const result = await InhouseService.updateSummonerForProfile(args[0], userid, guildid);
    // Create and assign summoner to account
    // message.channel.send(result);
  }
}

export class ShowLeague extends Command {
  constructor() {
    super(["inhouse", "league"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Create and assign summoner to account
    const result = await OutputService.outputLeagueInformation(message.guild.id);
    message.channel.send({ embed: result });
  }
}

export class InhouseHelp extends Command {
  constructor() {
    super(["inhouse"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Check for a valid argument
    if(args.length !== 0) return;

    class Command {
      caller: string;
      description: string;
    }

    let basicCommands: Array<Command> = [];

    basicCommands.push({
      caller: "!inhouse",
      description: "Shows this help screen"
    });

    basicCommands.push({
      caller: "!inhouse league",
      description: "Shows the info about this server's inhouse league."
    });
    basicCommands.push({
      caller: "!inhouse add SUMMONER",
      description: "Creates an inhouse profile on this server, tied to the specified summoner."
    });
    basicCommands.push({
      caller: "!inhouse profile [DISCORD_USERNAME]",
      description: "Views your inhouse profile, or the specified discord user's profile."
    });

    basicCommands.push({
      caller: "!inhouse game start",
      description: "Starts watching the inhouse game you are currently in."
    });

    basicCommands.push({
      caller: "!inhouse game [MATCHID | \"recent\"]",
      description: "Shows the game sats for the game with the given match id, or the most recent game."
    });
    basicCommands.push({
      caller: "!inhouse games [PAGE_NUMBER]",
      description: "Shows the most recent 5 games. Specify a page number (starting from 1) to get later games."
    });

    let output: string = "";
    basicCommands.forEach((command: Command) => {
      output += "**" + command.caller + "**:\n " + command.description + "\n";
    });

    message.channel.send(output);
  }
}

export class Watch extends Command {
  constructor() {
    super(["inhouse", "watch"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    await MatchService.addPlayerToWatchlist(message.channel.id, message.member.id, message.guild.id);
    message.channel.send("Your games are now being watched!");
  }
}

export class Unwatch extends Command {
  constructor() {
    super(["inhouse", "unwatch"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    await MatchService.removePlayerFromWatchlist(message.member.id, message.guild.id);
    message.channel.send("Your games are no longer being watched.");
  }
}
