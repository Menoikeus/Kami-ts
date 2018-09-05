import { CommandList, Command } from '../services/CommandService';
import { GenerateTeam, GenerateRankedTeam, RollDice } from './GeneralCommands';
import { GetProfile } from './inhouse/ProfileCommands';
import { GetLeague } from './inhouse/LeagueCommands';
import { AddSummoner, ShowLeague, InhouseHelp, ReassignSummoner } from './inhouse/InhouseCommands';
import { StartMatch, ShowMatch, ShowMatches } from './inhouse/game/GameCommands';


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
    this.commands.push(new StartMatch());
    this.commands.push(new ShowMatch());
    this.commands.push(new ShowMatches());
    this.commands.push(new ShowLeague());
    this.commands.push(new InhouseHelp());
    this.commands.push(new ReassignSummoner());
  }
};
