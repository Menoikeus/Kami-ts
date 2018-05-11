import Tree from "../data_structures/Tree";
import { Message, Client, GuildMember } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import RiotApiService from "./RiotApiService";
import InfoService from "./InfoService";

export default class InhouseService {
  /** Gets the inhouse profile in a guild for a discord user using their
      discord id */
  public static getInhouseProfileByDiscordId(userid: string, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_players")
      .findOne({ userid: userid });
  }

  /** Gets the inhouse profile in a guild for a discord user using their
      discord id */
  public static getInhouseProfileByLeagueId(leagueid: string, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_players")
      .findOne({ leagueid: leagueid });
  }

  /** Gets inhouse profiles in a guild that match the query conditions */
  public static getInhouseProfilesBy(query, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_players")
      .find(query).toArray();
  }

  /** Gets the inhouse players collection */
  public static getInhouseProfileCollection(guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_players");
  }

  public static async updateInhouseProfile(userid: string, guildid: string, summonerName: string): Promise<string> {
    const summoner = await RiotApiService.getSummonerByName(summonerName);
    const leagueid: string = summoner.id;

    // Get inhouse profile linked to summoner, if there is one
    const existingInhouseProfile = await InhouseService.getInhouseProfileByLeagueId(leagueid, guildid);
    if(existingInhouseProfile) throw new Error("The summoner " + summoner.name + " is already tied to an account!");

    // Get inhouse user by discord id
    const user = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);
    if(user) {
      if(user.leagueid !== undefined) {
        throw new Error("You already have a summoner linked to your account! " +
                        "Use !inhouse reassign <SUMMONER_NAME> if your server allows it!");
      }
      else {
        await InhouseService.getInhouseProfileCollection(guildid).update(
          { userid: userid },
          { $set: { leagueid: summoner.id } }
        );
        return "I've successfully linked your account with summoner " + summoner.name;
      }
    }
    else {
      const profile = await InhouseService.addNewProfile(userid, guildid, leagueid);
      return "I've successfully created your account with summoner " + summoner.name + " and elo " + profile.elo;
    }
  }

  /** Creates a profile given a userid, a guildid, and a summoner name, and assigns the
      profile to the summoner **/
  public static async createInhouseProfile(userid: string, guildid: string, summonerName: string): Promise<string> {
    const summoner = await RiotApiService.getSummonerByName(summonerName);
    const leagueid: string = summoner.id;

    // Get inhouse profile linked to summoner, if there is one
    const existingInhouseProfile = await InhouseService.getInhouseProfileByLeagueId(leagueid, guildid);
    if(existingInhouseProfile) throw new Error("The summoner " + leagueid + " is already tied to an account!");

    // Get inhouse user by discord id
    const user = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);
    if(user) throw new Error("You already have an inhouse profile!");

    const profile = await InhouseService.addNewProfile(userid, guildid, leagueid);
    return "I've successfully created your account with summoner " + summoner.name + " and elo " + profile.elo;
  }

  /** Adds a new profile to the inhouse players collection. Returns the info inserted. **/
  private static async addNewProfile(userid: string, guildid: string, leagueid: string) {
    const inhouse_info = await InfoService.getInhouseInfo(guildid);
    const info = {
      "userid"	    : userid,
      "leagueid"    : leagueid,
      "matches"     : [],
      "elo"         : inhouse_info.i_default_elo,
    }

    await InhouseService.getInhouseProfileCollection(guildid).insertOne(info);
    return info;
  }
}
