import Tree from "../data_structures/Tree";
import { Message, TextChannel, Client, GuildMember } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import RiotApiService from "./RiotApiService";
import InfoService from "./InfoService";
import InhouseService from "./InhouseService";

const schedule = require('node-schedule');

export default class MatchService {
  public static async insertUnfinishedMatchIntoDatabase(game, guildid: string, channelid: string) {
    game.completed = false;

    let ongoingGame: any = {};

    ongoingGame.gameId = game.gameId;
    ongoingGame.channelId = game.channelid;
    ongoingGame.participants = game.participants;
    ongoingGame.gameStartTime = game.gameStartTime;
    ongoingGame.completed = false;

    // Insert the match
    await InhouseService.getInhouseMatchesCollection(guildid).update({ gameId: ongoingGame.gameId }, ongoingGame, { upsert: true });
  }

  public static async startMatchWatcher(client: Client, guildid: string) {
    schedule.scheduleJob('*/5 * * * *', async function() {
      let ongoingMatches = await InhouseService.getInhouseMatchesCollection(guildid).find({ completed: false }).toArray();
      let inhouseInfo = await InfoService.getInhouseInfo(guildid);

      ongoingMatches.forEach(async function(match) {
        let channel: TextChannel = client.guilds[guildid].channels[match.channelId];
        let matchid = match.gameId;
        let finishedGame;

        try {
          finishedGame = await MatchService.getGameStatus(matchid, match.participants[0].summonerId);
        }
        catch(error) {
          if(error.statusCode && error.statusCode === 404) {
            channel.send(error.message);
            await InhouseService.getInhouseMatchesCollection(guildid).deleteOne({ gameId: matchid });
          }
          throw error;
        }

        let inhousePlayers = await InhouseService.getAllInhousePlayersInGame(match, guildid);
        let inhousePlayerMap = {};
        for(let i in inhousePlayers) {
          inhousePlayerMap[inhousePlayers[i].leagueid] = inhousePlayers[i];
        }

        let finalParticipants = [];
        finishedGame.participants.forEach(finishedParticipant => {
          match.participants.forEach(matchParticipant => {
            const championid = matchParticipant.championId;
            const teamid = matchParticipant.teamId;

            if(finishedParticipant.teamId === teamid && finishedParticipant.championId === championid) {
              if(inhousePlayers[matchParticipant.summonerId]) {
                finishedParticipant.userid = inhousePlayers[matchParticipant.summonerId].userid,
                finishedParticipant.summonerId = inhousePlayers[matchParticipant.summonerId].leagueid;
              }
              finalParticipants.push(finishedParticipant);
            }
          });
        });

        const winnerid = finishedGame.teams[0].win == "Fail" ? 200 : 100;
        let players = MatchService.calculateEloDelta(finalParticipants, inhouseInfo.i_volatility_constant, winnerid);

        // Input elo changes
        players.forEach(player => {
          // update info if they're in the league
          if(player.userid) {
            InhouseService.getInhouseProfileCollection(guildid).update(
              { userid: player.userid },
              { $inc:
                { elo:  ( player.elo_delta) },
                $push:
                { matches : String(matchid) }
              }
            );
          }
        });

        // Add finished game to db
        const currentTime = (new Date()).getTime();
        const query = String(matchid);
        await InhouseService.getInhouseMatchesCollection(guildid).replaceOne(
          { matchid: query },
          {
            matchid       :  matchid,
            players       :  players,
            teams         :  finishedGame.teams,
            winning_team  :  winnerid,
            length        :  finishedGame.gameDuration,
            date          :  currentTime,
            completed     :  true
          });

        channel.send("Inhouse game completed!");
      });
    });
  }

  private static async getGameStatus(gameid: string, leagueid: string) {
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
            messsage: "The game with id " + gameid + " ended prematurely! Not counting match.",
            statusCode: 404
          }
        }
        else throw error;
      }
    }
  }

  private static calculateEloDelta(participants, volatilityConstant: number, winnerid: number) {
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
