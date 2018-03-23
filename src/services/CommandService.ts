import Tree from "../data_structures/Tree";
import { Message, Client } from "discord.js";

/** An interface representing a command */
export abstract class Command {
  caller: string[];

  constructor(caller: string[]) {
    this.caller = caller;
  }

  abstract async run (client: Client, message: Message, args: string[]);
}

export interface CommandList {
  commands: Command[];
}

/** The command handling class, to handle incoming commands */
export class CommandHandler {
  client: Client;
  commands: Tree<String, Command>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Tree<String, Command>();
  };

  public addCommands(commandList: CommandList) {
    commandList.commands.forEach((command: Command) => {
      this.addCommand(command);
    });
  }

  /** Method to add a command to the handler */
  public addCommand(command: Command): CommandHandler {
    // Check if the caller array of strings is of the correct format
    if(!command.caller.every((str: string) => { return !!str.match(/^[A-Z|a-z]+$/) })) {
      throw new Error("The command caller doesn't follow the correct format!");
    }

    // Get the strings in the caller
    let constituents: string[] = command.caller.slice();

    // Insert the command
    this.commands.insert(constituents, command);
    return this;
  }

  /** Given a full command, find the appropriate command object and run its
      method on the given arguments and flags */
  public async findAndRun(message: Message, prefix: string) {
    // Get rid of the command prefix
    let regex: RegExp = new RegExp("^" + prefix);
    let content: string = message.content.replace(regex, "");

    // Check for mismatched quotes
    if((content.match(/\"/g) || []).length % 2 !== 0) {
      throw new Error("Mismatched quotes!");
    }

    // Split the command string on spaces after triming and getting rid of
    // double spaces
    let constituents: string[] = content.trim()
                                        .split(/("[^"]+"|[^"\s]+)/g)
                                        .filter((val) => val.trim());

    // Go through the command tree to find the appropriate command
    let targetCommand: Command = this.commands.traverse(constituents.slice());

    // If it it's there, run the command
    if(targetCommand !== undefined) {
      // Get the caller
      let caller: string[] = targetCommand.caller;

      // Get rid of the strings used to call the function, and remove quotes
      let args: string[] = [];
      constituents.slice(caller.length).forEach((str: string) => { if(str) args.push(str.replace(/\"/g, "")); });

      // Finally, run the method, and catch bubbled errors
      await targetCommand.run(this.client, message, args);
    }
  }
}
