import { Message, Client, User, Guild } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import InfoService from './InfoService';
import InhouseService from "./InhouseService";

export default class StatisticsService {
  public static async getInhouseProfileStatisticsByUserId(userid: string, guildid: string) {
    let stats = await InhouseService.getInhouseMatchesCollection(guildid).aggregate([
      {
      "$match" : {
        "players.userid" : userid
      }
      },
      {
      "$project" : {
        "players" : 1.0,
        "winningTeam" : "$winning_team",
        "_id" : 0.0
      }
      },
      {
      "$unwind" : {
        "path" : "$players"
      }
      },
      {
      "$match" : {
        "players.userid" : userid
      }
      },
      {
      "$addFields" : {
        "players.win" : {
        "$eq" : [
          "$winningTeam",
          "$players.teamId"
        ]
        }
      }
      },
      {
      "$replaceRoot" : {
        "newRoot" : "$players"
      }
      },
      {
        "$group" : {
          "_id" : null,
          "averageKills" : {
          "$avg" : "$stats.kills"
          },
          "averageDeaths" : {
          "$avg" : "$stats.deaths"
          },
          "averageAssists" : {
          "$avg" : "$stats.assists"
          },
          "matchesPlayed" : {
          "$sum" : 1.0
          },
          "totalWins" : {
            "$sum" : {
              "$cond" : [ "$win", 1.0, 0.0 ]
            }
          }
        }
      }
    ]).toArray();

    return stats[0];
  }

  public static async getRecentMatchDataByUserId(userid: string, guildid: string, numMatches: number = 3) {
    let recentMatches = await InhouseService.getInhouseMatchesCollection(guildid).aggregate([
      {
        "$match" : {
          "players.userid" : userid,
          "completed" : true
        }
      },
      {
        "$project" : {
          "matchid" : 1.0,
          "players" : 1.0,
          "winningTeam" : "$winning_team",
          "_id" : 0.0
        }
      },
      {
        "$unwind" : {
          "path" : "$players"
        }
      },
      {
        "$match" : {
          "players.userid" : userid
        }
      },
      {
        "$addFields" : {
          "players.win" : {
            "$eq" : [
              "$winningTeam",
              "$players.teamId"
            ]
          },
          "players.matchid": "$matchid"
        }
      },
      {
        "$replaceRoot" : {
          "newRoot" : "$players"
        }
      },
      {
        "$project" : {
          "matchid": 1.0,
          "championId" : 1.0,
          "stats.kills" : 1.0,
          "stats.deaths" : 1.0,
          "stats.assists" : 1.0,
          "summonerId" : 1.0,
          "elo_delta" : 1.0,
          "win" : 1.0
        }
      },
      {
        "$sort" : {
          "natural" : -1.0
        }
      },
      {
        "$limit" : numMatches
      }
    ]).toArray();

    return recentMatches;
  }
}
