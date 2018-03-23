import Tree from "../data_structures/Tree";
import { Message, Client } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';

export default class ProfileService {
  /** Gets the profile for a specific user within a guild through the user's
      and guild's ids */
  public static getUserProfileById(userid: string, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("users").findOne({ userid: userid });
  }

  /* General queries */
  /** Gets user profiles in a guild that match the query conditions */
  public static getUserProfilesBy(query, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("users")
      .find(query).toArray();
  }

  /* Lower level collection getting */
  /** Gets the users collection */
  public static getUserCollection(guildid: string): Collection {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("users");
  }
}
