import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../../services/CommandService';
import InhouseService from '../../services/InhouseService';
import RiotApiService from '../../services/RiotApiService';
import InfoService from '../../services/InfoService';
import OutputService from '../../services/OutputService';

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

export class ShowLeague extends Command {
  constructor() {
    super(["inhouse", "league"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    // Check for a valid argument
    if(args.length !== 0) throw new Error("This command doesn't take any arguments!");

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
    if(args.length !== 0) throw new Error("This command doesn't take any arguments!");

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
      caller: "!inhouse add $SUMMONER",
      description: "Creates an inhouse profile on this server, tied to the specified summoner."
    });
    basicCommands.push({
      caller: "!inhouse profile [$DISCORD_USERNAME]",
      description: "Views your inhouse profile, or the specified discord user's profile."
    });

    basicCommands.push({
      caller: "!inhouse game start",
      description: "Starts watching the inhouse game you are currently in."
    });

    basicCommands.push({
      caller: "!inhouse game [$MATCHID | \"recent\"]",
      description: "Shows the game sats for the game with the given match id, or the most recent game."
    });
    basicCommands.push({
      caller: "!inhouse games [$PAGE_NUMBER]",
      description: "Shows the most recent 5 games. Specify a page number (starting from 1) to get later games."
    });

    let output: string = "";
    basicCommands.forEach((command: Command) => {
      output += "**" + command.caller + "**:\n " + command.description + "\n";
    });

    message.channel.send(output);
  }
}
