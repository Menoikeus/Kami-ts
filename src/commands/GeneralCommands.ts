import { Client, Message } from 'discord.js';
import { Command, CommandList } from '../services/CommandService';

/** Generates a team given a player names */
export class GenerateTeam extends Command {
  constructor() {
    super(["team"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    const teamMembers: string[] = args;
    if(teamMembers.length < 2) throw new Error("You need at least two team members to create teams!");

  	// two teams, and we need max team sizes
  	let blueMax: number = Math.ceil((teamMembers.length)/2.);
  	let redMax: number = Math.ceil((teamMembers.length)/2.);

  	let blue: string[] = [];
  	let red: string[] = [];
  	// push players randomnly into the teams until a team is full, then fill up the other team
  	for(let i = 0; i < teamMembers.length; i++) {
  		let teamRand: number = Math.floor(Math.random() * 2);

  		if(teamRand == 0) {
  			if(blueMax > 0) {
  				blue.push(teamMembers[i]);
  				blueMax--;
  			}
  			else {
  				red.push(teamMembers[i]);
  				redMax--;
  			}
  		}
  		else {
  			if(redMax > 0) {
  				red.push(teamMembers[i]);
  				redMax--;
  			}
  			else {
  				blue.push(teamMembers[i]);
  				blueMax--;
  			}
  		}
  	}

  	// OUTPUT!
  	let output: string = "";
  	output += "__**Team 1:**__\n";
  	for(let i = 0; i < blue.length; i++) {
  		output += "*" + blue[i] + "*\n";
  	}
  	output += "\n__**Team 2:**__\n";
  	for(let i = 0; i < red.length; i++) {
  		output += "*" + red[i] + "*\n";
  	}

  	message.channel.send(output);
  }
}

/** Generates a ranked team given a player names and ranks */
export class GenerateRankedTeam extends Command {
  constructor() {
    super(["rankedteam"]);
  };

  public async run(client: Client, message: Message, args: string[]) {
    const teamMembers: string[] = args;
    if(teamMembers.length < 2) throw new Error("You need at least two team members to create teams!");

    let threshold: number = 3;    // represents how different the teams can be in rank
    if(!isNaN(Number(args[0]))) {  // if the user specifies a custom threshold, set it
      threshold = parseInt(args[0])
      args = args.slice(1);
    }

    // max team sizes
  	const blueMax: number = Math.ceil((args.length/2)/2.);
  	const redMax: number = Math.ceil((args.length/2)/2.);

    // make a dictionary of player ranks
    let playerRanks: { [playerName: string]: number } = {};
    let players: string[] = [];
    for(let i = 0; i < args.length/2; i++) {
      playerRanks[args[2*i]] = Number(args[2*i+1]);
      players[i] = args[2*i];
    }

  	// number of tries
  	let numTries: number = 0;
    // two teams and balance boolean
  	let blue: string[] = [];
  	let red: string[] = [];
    let balanced: boolean = false;
    do {
      blue = [];
      red = [];

      let bMax: number = blueMax;
      let rMax: number = redMax;

      // same as in !team, randomly place players in until full
    	for(let i = 0; i < players.length; i++) {
    		let teamRand: number = Math.floor(Math.random() * 2);

    		if(teamRand == 0) {
    			if(bMax > 0) {
    				blue.push(players[i]);
    				bMax--;
    			}
    			else {
    				red.push(players[i]);
    				rMax--;
    			}
    		}
    		else {
    			if(rMax > 0) {
    				red.push(players[i]);
    				rMax--;
    			}
    			else {
    				blue.push(players[i]);
    				bMax--;
    			}
    		}
    	}

      // However, here, added up the ranks and then compare to see if the teams are fair
      let sumBlue: number = 0;
      let sumRed: number = 0;
      for(let b = 0; b < blue.length; b++) {
        sumBlue += playerRanks[blue[b]];
      }
      for(let r = 0; r < red.length; r++) {
        sumRed += playerRanks[red[r]];
      }

      if(Math.abs(sumRed-sumBlue) <= threshold) {
        balanced = true;
      }
  		numTries++;
    } while(!balanced && numTries < 1000);

  	if(!balanced) {
  		message.channel.send("It's too hard to make teams out of these players! Could you change the rankings or increase the threshold?");
  	}
  	else {
  	  // OUTPUT!
  		let output: string = "";
  		output += "__**Team 1:**__\n";
  		for(let i = 0; i < blue.length; i++) {
  			output += "*" + blue[i] + "*\n";
  		}
  		output += "\n__**Team 2:**__\n";
  		for(let i = 0; i < red.length; i++) {
  			output += "*" + red[i] + "*\n";
  		}

  		message.channel.send(output);
  	}
  }
}

export class RollDice extends Command {
  constructor() {
    super(["roll"]);
  }

  public async run(client: Client, message: Message, args: string[]) {
    if(args.length == 0) {
  		message.channel.send('**' + Math.ceil(Math.random() * 6) + '**');
  	}
  	else if(args.length == 1) {
  		message.channel.send('**' + Math.ceil(Math.random() * Number(args[0])) + '**');
  	}
  	else {
  		message.channel.send('**' + ((Number(args[0])-1)+Math.ceil(Math.random() * (Number(args[1]) - Number(args[0]) + 1))) + '**');
  	}
  }
}
