import Tree from "../data_structures/Tree";
import { Message, Client, User, GuildMember, Guild } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';

export default class ProfileService {
  /** Gets the profile for a specific user within a guild through the user's
      and guild's ids */
  public static getUserProfileById(userid: string, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    return db.db(guildid).collection("users").findOne({ userid: String(userid) });
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

  public static async createProfileInServer(username: string, userid: string, guildid: string) {
    let userObj = {
      "userid"		: String(userid),
      "username"  : String(username),
      "level"			: Number(0),
  		"exp"				: Number(0)
    }

    let existingUser = await ProfileService.getUserProfileById(userid, guildid);
    if(!existingUser) {
      await ProfileService.getUserCollection(guildid).insertOne(userObj);
      console.log("New user " + userid + " added to guild " + guildid);
    }
  }
}
