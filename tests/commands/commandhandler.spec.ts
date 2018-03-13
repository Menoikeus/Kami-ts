import { Command, CommandHandler } from '../../src/services/CommandService';
import { Client, Message, TextChannel, Guild } from "discord.js";

import { expect } from 'chai';
import 'mocha';

describe('Command tests', () => {
  // Create reusable command
  let command: Command = {
    caller: ["inhouse", "join"],
    run (client: Client, message: Message, args: string[]): void {
      expect(true).to.be.true;
    }
  };

  it('Command creation', () => {
    // Not null
    expect(command).to.be.not.null;
  });

  it('Command handler creation', () => {
    // Create command and check
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    expect(commandHandler).to.be.not.null;
  });

  it('Command handler taking in command', () => {
    // Create handler
    let commandHandler: CommandHandler = new CommandHandler(new Client());

    // Add command and check
    commandHandler.addCommand(command);
    expect(command).to.be.not.null;
    expect(commandHandler).to.be.not.null;
  });

  it('Command handler reading a command', () => {
    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    expect(commandHandler.findAndRun({ content: "!inhouse join" } as any, "!")).to.be.true;
  });

  it('Command handler with nonexistent command', () => {
    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    expect(commandHandler.findAndRun({ content: "!house join" } as any, "!")).to.be.false;
  });

  it('Command handler with command with args', () => {
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      run (client: Client, message: Message, args: string[]): void {
        expect(args.join("")).to.be.equal("#1523");
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    expect(commandHandler.findAndRun({ content: "!inhouse join #1523" } as any, "!")).to.be.true;
  });

  it('Command handler with command with multiple args', () => {
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      run (client: Client, message: Message, args: string[]): void {
        expect(args[1]).to.be.equal("#1523");
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    expect(commandHandler.findAndRun({ content: "!inhouse join mingo #1523 de" } as any, "!")).to.be.true;
  });

  it('Command handler with command with quoted args', () => {
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      run (client: Client, message: Message, args: string[]): void {
        expect(args[0]).to.be.equal("John Pikeman's lobby");
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    expect(commandHandler.findAndRun({ content: "!inhouse join \"John Pikeman's lobby\"" } as any, "!")).to.be.true;
  });

  it('Command handler with command with mismatched quotes', () => {
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      run (client: Client, message: Message, args: string[]): void {
        expect(args[0]).to.be.equal("John Pikeman's lobby");
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    expect(commandHandler.findAndRun.bind(commandHandler, { content: "!inhouse join \"John Pikeman's\" lobby\"" } as any, "!")).to.throw();
  });

  it('Command handler with command with weird spacing', () => {
    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    expect(commandHandler.findAndRun({ content: "!inhouse    join  " } as any, "!")).to.be.true;
  });
});
