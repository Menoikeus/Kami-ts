import Tree from "../data_structures/Tree";
import { Message, Client } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';

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
}
