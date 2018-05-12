import { CommandList, Command } from '../services/CommandService';
import { GenerateTeam, GenerateRankedTeam, RollDice } from './GeneralCommands';
import { GetProfile } from './inhouse/ProfileCommands';
import { GetLeague } from './inhouse/LeagueCommands';
import { AddSummoner } from './inhouse/InhouseCommands';
import { StartGame } from './inhouse/game/GameCommands';


export default class AllCommands implements CommandList {
  commands: Command[];

  constructor() {
    this.commands = [];
    this.commands.push(new GenerateTeam());
    this.commands.push(new GetProfile());
    this.commands.push(new GetLeague());
    this.commands.push(new GenerateRankedTeam());
    this.commands.push(new RollDice());
    this.commands.push(new AddSummoner());
    this.commands.push(new StartGame());
  }
};
