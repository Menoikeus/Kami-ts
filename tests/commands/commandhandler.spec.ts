import { Command, CommandHandler } from '../../src/services/CommandService';
import { Client, Message, TextChannel, Guild } from "discord.js";
const mongodb_config = require('../config/mongo_config.json');
import 'mocha';

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect;

describe('Command tests', () => {
  // Create reusable command
  let command: Command = {
    caller: ["inhouse", "join"],
    async run (client: Client, message: Message, args: string[]) {
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

  it('Command handler reading a command', async () => {
    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    await expect(commandHandler.findAndRun({ content: "!inhouse join" } as any, "!")).to.not.be.rejected;
  });

  it('Command handler with nonexistent command', async () => {
    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    await expect(commandHandler.findAndRun({ content: "!house join" } as any, "!")).to.not.be.rejected;
  });

  it('Command handler with command with args', async () => {
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      async run (client: Client, message: Message, args: string[]) {
        expect(args.join("")).to.be.equal("#1523");
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    await expect(commandHandler.findAndRun({ content: "!inhouse join #1523" } as any, "!")).to.not.be.rejected;
  });

  it('Command handler with command with multiple args', async  () => {
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      async run (client: Client, message: Message, args: string[]) {
        expect(args[1]).to.be.equal("#1523");
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    await expect(commandHandler.findAndRun({ content: "!inhouse join mingo #1523 de" } as any, "!")).to.not.be.rejected;
  });

  it('Command handler with command with quoted args', () => {
    let ran: boolean = false;
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      async run (client: Client, message: Message, args: string[]) {
        expect(args[0]).to.be.equal("John Pikeman's lobby");
        ran = true;
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    commandHandler.findAndRun({ content: "!inhouse join \"John Pikeman's lobby\"" } as any, "!").then(() => {
      expect(ran).to.be.true;
    });
  });

  it('Command handler with command with mismatched quotes', async () => {
    // Create command with args
    let command: Command = {
      caller: ["inhouse", "join"],
      async run (client: Client, message: Message, args: string[]) {
        expect(args[0]).to.be.equal("John Pikeman's lobby");
      }
    };

    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    let threw: boolean = false;
    // Find and run
    await expect(commandHandler.findAndRun({ content: "!inhouse join \"John Pikeman's\" lobby\"" } as any, "!")).to.be.rejected;
  });

  it('Command handler with command with weird spacing', async () => {
    // Create command handler and add command
    let commandHandler: CommandHandler = new CommandHandler(new Client());
    commandHandler.addCommand(command);

    // Find and run
    await expect(commandHandler.findAndRun({ content: "!inhouse    join  " } as any, "!")).to.not.be.rejected;
  });
});
