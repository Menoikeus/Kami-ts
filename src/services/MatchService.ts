import Tree from "../data_structures/Tree";
import { Message, TextChannel, Client, GuildMember, User } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import RiotApiService from "./RiotApiService";
import InfoService from "./InfoService";
import InhouseService from "./InhouseService";
import OutputService from "./OutputService";

const schedule = require('node-schedule');

export default class MatchService {
  public static async insertUnfinishedMatchIntoDatabase(match, guildid: string, channelid: string) {
    let ongoingMatch: any = {};

    ongoingMatch.matchid = String(match.gameId);
    ongoingMatch.channelid = channelid;
    ongoingMatch.participants = match.participants;
    ongoingMatch.matchStartTime = match.gameStartTime;
    ongoingMatch.completed = false;

    // Insert the match
    await InhouseService.getInhouseMatchesCollection(guildid).update({ matchid: ongoingMatch.gameId }, ongoingMatch, { upsert: true });
  }

  public static async startMatchWatcher(client: Client, guildid: string) {
    console.log("Created watcher for guild " + guildid);

    // Represents the time (in minutes) between checking the game statuses for each guild
    const minutesBetweenChecks: number = 3;

    // Every 3rd minute, we're gonna go through all the incomplete matches for the guild
    let minSinceCheck: number = Math.floor(Math.random() * minutesBetweenChecks);
    schedule.scheduleJob(Math.floor(Math.random() * 60) + ' * * * * *', async function() {
      if(minSinceCheck + 1 >= 3) {
        minSinceCheck = 0;
        console.log("Checking game status for guild " + guildid);

        // Find all unfinished inhouse matches and the guild's inhouse settings
        let ongoingMatches = await InhouseService.getInhouseMatchesCollection(guildid).find({ completed: false }).toArray();
        let inhouseInfo = ongoingMatches.length == 0 ? {} : await InfoService.getInhouseInfo(guildid);

        // Iterate through the unfinished matches for the guild
        ongoingMatches.forEach(async function(match) {
          // Get the text channel that the match was started in
          let channel: TextChannel = <TextChannel>client.guilds.get(guildid).channels.get(match.channelid);
          let matchid: string = match.matchid;

          // See if the match is completed. If the match never completed, delete
          // the match from the database
          let finishedMatch;
          try {
            finishedMatch = await MatchService.getMatchStatus(matchid, match.participants[0].summonerId);
          }
          catch(error) {
            // Delete the match from the database
            await InhouseService.getInhouseMatchesCollection(guildid).deleteOne({ matchid: matchid });
            // If the match ended prematurely, send a message
            if(error.statusCode && error.statusCode === 404) {
              channel.send(error.message);
            }
            throw error;
          }

          // If the match is finished and we have a copy of the match
          if(finishedMatch) {
            // Run the match finishing code
            let message = await MatchService.checkMatch(match, finishedMatch, inhouseInfo, guildid);
            channel.send(message);

            // Output the match
            let completedMatch = await InhouseService.getInhouseMatchByMatchId(match.matchid, guildid);
            if(completedMatch && completedMatch.completed) {
              let output = await OutputService.outputMatch(completedMatch);
              channel.send({ embed: output });
            }
          }
        });
      }
      else {
        minSinceCheck += 1;
      }
    });
  }

  public static async startPlayerWatcher(client: Client, guildid: string) {
    console.log("Created watchlist watcher for guild " + guildid);
    // Represents the time (in minutes) between checking for a game for each player
    const minutesBetweenChecks: number = 5;

    // Every 5th minute, check to see if any of the players on the watchlist are in a game
    let minSinceCheck: number = Math.floor(Math.random() * minutesBetweenChecks);
    schedule.scheduleJob(Math.floor(Math.random() * 60) + ' * * * * *', async function() {
      if(minSinceCheck + 1 >= minutesBetweenChecks) {
        minSinceCheck = 0;

        let watchlist = await InhouseService.getInhouseWatchlistCollection(guildid).find({}).toArray();
        let checked: Array<string> = [];
        // Iterate through the watchlist
        for(let profile of watchlist) {
          const userid = profile.userid
          if(checked.indexOf(userid) !== -1) continue;

          const discordUser = client.users.get(userid);
          const gameInstance = discordUser.presence.game;

          if(gameInstance && gameInstance.details && gameInstance.details.includes('Summoner\'s Rift (Custom)')) {
            console.log("Checking for inhouse match for user " + userid + " in guild " + guildid);
            // Get the summoner's game
            let game;
            try {
              game = await RiotApiService.getCurrentGameByUserId(userid, guildid);
            }
            catch(err) {
              // If the game hasn't started yet
              continue;
            }
            console.log("Game found");

            // Get all the players in the game
            const inhousePlayers: Array<Object> = await InhouseService.getAllInhousePlayersInMatch(game, guildid);

            // Remove players from this round of match checking (since we don't want to double check) by adding
            // to the checked players list
            const inhousePlayerUserIds: Array<string> = inhousePlayers.map((p: any) => { return p.userid });
            checked.concat(inhousePlayerUserIds);

            // Check if we're watching the game already
            let existingGame = await InhouseService.getInhouseMatchByMatchId(game.gameId, guildid);
            if(existingGame) continue;

            // See if there are enough inhouse players to qualify
            const inhouseInfo = await InfoService.getInhouseInfo(guildid);
            if(inhousePlayers.length < inhouseInfo.i_minimum_players) continue;


            // Insert the match
            await MatchService.insertUnfinishedMatchIntoDatabase(game, guildid, profile.channelid);

            // Send a message confirming match start
            let players: Array<String> = [];
            inhousePlayers.forEach((player: any) => {
              let user: User = client.users.get(player.userid);
              players.push(user.username);
            });

            let channel: TextChannel = <TextChannel>client.guilds.get(guildid).channels.get(profile.channelid);
            channel.send(players.join(", ") + " " + (players.length === 1 ? "has" : "have") + " started a match with id " + game.gameId)
          }
        }

      }
      else {
        minSinceCheck += 1;
      }
    });
  }

  // Adds the player to the watchlist, so that their games are automatically recorded
  public static async addPlayerToWatchlist(channelid: string, userid: string, guildid: string) {
    let profile = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);
    if(!profile) throw new Error("You don't have an inhouse profile yet! Add yourself with !inhouse add SUMMONERNAME.");

    await InhouseService.getInhouseWatchlistCollection(guildid).update({ userid: userid }, { userid: userid, channelid: channelid }, { upsert: true });
  }

  public static async removePlayerFromWatchlist(userid: string, guildid: string) {
    await InhouseService.getInhouseWatchlistCollection(guildid).remove({ userid: userid });
  }

  /**
    Takes in the finished match and the match stored in the database, and completes
    the match on the database
  */
  public static async checkMatch(match, finishedMatch, inhouseInfo, guildid: string): Promise<String> {
    let matchid: string = match.matchid

    // Go through all the inhouse players in the match and create a hashmap linking
    // leagueid to the player
    let inhousePlayers = await InhouseService.getAllInhousePlayersInMatch(match, guildid);
    let inhousePlayerMap = {};
    for(let i in inhousePlayers) {
      inhousePlayerMap[inhousePlayers[i].leagueid] = inhousePlayers[i];
    }

    // Go through all the participants in the finished match data and the stored
    // match data, and linked each player with their respective inhouse profile
    let finalParticipants = [];
    finishedMatch.participants.forEach(finishedParticipant => {
      match.participants.forEach(matchParticipant => {
        const championid = matchParticipant.championId;
        const teamid = matchParticipant.teamId;

        if(finishedParticipant.teamId == teamid && finishedParticipant.championId == championid) {
          if(inhousePlayerMap[matchParticipant.summonerId]) {
            finishedParticipant.userid = inhousePlayerMap[matchParticipant.summonerId].userid;
            finishedParticipant.summonerId = inhousePlayerMap[matchParticipant.summonerId].leagueid;
            finishedParticipant.elo = inhousePlayerMap[matchParticipant.summonerId].elo;
          }
          else {
            finishedParticipant.elo = inhouseInfo.i_default_elo;
          }
          finalParticipants.push(finishedParticipant);
        }
      });
    });

    const winnerid = finishedMatch.teams[0].win == "Fail" ? 200 : 100;
    let players = MatchService.calculateEloDelta(finalParticipants, inhouseInfo.i_volatility_constant, winnerid);

    // Input elo changes
    players.forEach(player => {
      // update info if they're in the league
      if(player.userid) {
        InhouseService.getInhouseProfileCollection(guildid).update(
          { userid: player.userid },
          { $inc:
            { elo:  player.elo_delta }
          }
        );
      }
    });

    // Add finished game to db
    const completionTime: number = finishedMatch.gameCreation + finishedMatch.gameDuration * 1000;
    await InhouseService.getInhouseMatchesCollection(guildid).replaceOne(
      { matchid: matchid },
      {
        matchid       :  matchid,
        players       :  players,
        teams         :  finishedMatch.teams,
        winning_team  :  winnerid,
        length        :  finishedMatch.gameDuration,
        date          :  completionTime,
        completed     :  true
      });

    console.log("Match " + matchid + " for guild " + guildid + " has been completed");
    return "Inhouse match " + matchid + " completed!";
  }

  private static async getMatchStatus(gameid: string, leagueid: string) {
    // Try to get the finished game data
    try {
      return await RiotApiService.getFinishedGameByGameId(gameid);
    }
    catch(error) {
      // If there is an error, the game has likely not finished yet
      try {
        if(await RiotApiService.getCurrentGameByLeagueId(leagueid)) return null;
      }
      catch(error2) {
        // If there is yet another error, and its a 404, then the game no longer exists.
        // Thus, the game ended prematurely
        if(error.statusCode && error.statusCode === 404) {
          throw {
            messsage: "Match " + gameid + " ended prematurely! Not counting match.",
            statusCode: 404
          }
        }
        else throw error;
      }
    }
  }

  public static calculateEloDelta(participants, volatilityConstant: number, winnerid: number) {
    const loserid = winnerid == 100 ? 200 : 100;
    const winning_players = participants.filter(participant => participant.teamId == winnerid);
    const losing_players = participants.filter(participant => participant.teamId == loserid);
    var total_winner_elo = 0;
    var total_loser_elo = 0;
    for(let key in winning_players) {
      total_winner_elo += winning_players[key].elo;
    }
    for(let key in losing_players) {
      total_loser_elo += losing_players[key].elo;
    }

    const weight = 1 - (total_winner_elo / (total_winner_elo + total_loser_elo));
    const winner_gain = weight * volatilityConstant;

    for(let key in winning_players) {
      const fraction_of_players = winning_players.length / 5;
      let elo_change = winner_gain *
                        ((total_winner_elo - winning_players[key].elo) / (total_winner_elo * (winning_players.length - 1)));
      elo_change = Math.round(fraction_of_players * elo_change);

      winning_players[key].elo_delta = elo_change;
    }
    for(let key in losing_players) {
      var elo_change;
      if(losing_players.length > 1) {
        elo_change = winner_gain * (losing_players[key].elo / total_loser_elo);
      }
      else {
        elo_change = winner_gain
      }
      const fraction_of_players = losing_players.length / 5;
      elo_change = -1 * Math.round(fraction_of_players * elo_change);

      losing_players[key].elo_delta = elo_change;
    }

    return winning_players.concat(losing_players);
  }
}
