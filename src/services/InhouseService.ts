import Tree from "../data_structures/Tree";
import { Message, TextChannel, Client, GuildMember } from "discord.js";
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
      .findOne({ userid: String(userid) });
  }

  /** Gets the inhouse profile in a guild for a discord user using their
      discord id */
  public static getInhouseProfileByLeagueId(leagueid: string, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_players")
      .findOne({ leagueid: String(leagueid) });
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

  /** Gets the watchlist collection */
  public static getInhouseWatchlistCollection(guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_watchlist");
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
          { userid: String(userid) },
          { $set: { leagueid: String(summoner.id), summonerName: String(summoner.name) } }
        );
        return "I've successfully linked your account with summoner " + summoner.name;
      }
    }
    else {
      const profile = await InhouseService.addNewProfile(summonerName, userid, guildid, leagueid);
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

    const profile = await InhouseService.addNewProfile(summonerName, userid, guildid, leagueid);
    return "I've successfully created your account with summoner " + summoner.name + " and elo " + profile.elo;
  }

  /** Adds a new profile to the inhouse players collection. Returns the info inserted. **/
  private static async addNewProfile(summonerName: string, userid: string, guildid: string, leagueid: string) {
    const inhouse_info = await InfoService.getInhouseInfo(guildid);
    const info = {
      "userid"	    : String(userid),
      "leagueid"    : String(leagueid),
      "summonerName": String(summonerName),
      "elo"         : inhouse_info.i_default_elo,
    }

    await InhouseService.getInhouseProfileCollection(guildid).insertOne(info);
    return info;
  }

  /** Changes the summoner of an account */
  public static async updateSummonerForProfile(client: Client, summonerName: string, userid: string, guildid: string) {
    // Get the user's inhouse profile
    const existingInhousePlayer = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);
    if(!existingInhousePlayer) throw new Error("You don't have an inhouse profile yet! Add yourself with !inhouse add");

    // Get the summoner
    const summoner = await RiotApiService.getSummonerByName(summonerName);

    // See if anyone else has this summoner added
    const existingPlayerWithSummoner = await InhouseService.getInhouseProfileByLeagueId(summoner.id, guildid);
    if(existingPlayerWithSummoner) throw new Error(client.users.get(existingPlayerWithSummoner.userid).username + " already has that summoner linked!");

    // Otherwise change their summoner
    await InhouseService.getInhouseProfileCollection(guildid).update(
      { userid: String(userid) },
      { $set: { leagueid: String(summoner.id), summonerName: String(summoner.name) } }
    );
    return "I've successfully linked your account with summoner " + summoner.name;
  }

  // Updates summoner name
  public static async updateSummonerNameByDiscordId(userid: string, guildid: string): Promise<string> {
    const profile = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);
    const summoner = await RiotApiService.getSummonerByLeagueId(profile.leagueid);

    if(profile.summonerName != summoner.name) {
      await InhouseService.getInhouseProfileCollection(guildid).update(
        { userid: String(userid) },
        { $set: { summonerName: String(summoner.name) } }
      );
    }
    return summoner.name;
  }

  /** Gets all the inhouse players who are currently in this game */
  public static async getAllInhousePlayersInMatch(game, guildid: string): Promise<Array<any>> {
    let participantIds: Array<any> = [];
    game.participants.forEach((participant) => { participantIds.push(String(participant.summonerId)); });
    const query = {
      leagueid: {
        $in: participantIds
      }
    };

    return await InhouseService.getInhouseProfilesBy(query, guildid);
  }

  /************ Inhouse matches *****************************************************/
  /** Get an inhouse match by its game id **/
  public static getInhouseMatchByMatchId(matchid: string, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_matches")
      .findOne({ matchid: String(matchid) });
  }

  /** Get an inhouse match by a query **/
  public static getInhouseMatchBy(query, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_matches")
      .findOne(query);
  }

  /** Gets the inhouse players collection */
  public static getInhouseMatchesCollection(guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("inhouse_matches");
  }
}
