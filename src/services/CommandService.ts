import Tree from "../data_structures/Tree";
import { Message, Client } from "discord.js";

/** An interface representing a command */
export interface Command {
  caller: string[];
  run (client: Client, message: Message, args: string[]): void;
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
  public findAndRun(message: Message, prefix: string): boolean {
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
                                        .replace(/ +/g, " ")
                                        .split(" ");

    // Go through the command tree to find the appropriate command
    let targetCommand: Command = this.commands.traverse(constituents);

    // If it isn't there, return false. If it is...
    if(targetCommand === undefined) {
      return false;
    }
    else {
      // Regex to match the beginning of the message, which includes what was
      // used to call the command
      let regex: RegExp = new RegExp("^" + targetCommand.caller.join(" "));

      // Remove what was use to call the command from the full message, then
      // split the message
      let fieldString = content.replace(regex, "").trim();
      let fields: string[] = fieldString.split(/ +(?=([^\"]*\"[^\"]*\")*[^\"]*$)/);

      // Remove quotes
      let args: string[] = [];
      fields.forEach((str: string) => { if(str) args.push(str.replace(/\"/g, "")); });

      // Finally, run the method
      targetCommand.run(this.client, message, args);
      return true;
    }
  }
}
