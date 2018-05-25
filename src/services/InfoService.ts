import { Message, Client } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';

export default class InfoService {
  /** Gets the inhouse info of a specified guild */
  public static getInhouseInfo(guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("info").findOne({ info_type: "inhouse_info" });
  }

  /** Gets the directory info of a specified guild */
  public static getDirectoryInfo(guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("info").findOne({ info_type: "directory_info" });
  }

  /** Gets the info collection for a given guild */
  public static getInfoCollection(guildid: string): Collection {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("info");
  }

  /** Gets the global inhouse info from kami db **/
  public static getGlobalInhouseInfo(){
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db("kami_db").collection("global_info").findOne({
      info_type: "league_api_info"
    });
  }
}
