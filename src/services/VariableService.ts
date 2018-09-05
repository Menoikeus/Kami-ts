import Tree from "../data_structures/Tree";
import { Message, TextChannel, Client, GuildMember } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import RiotApiService from "./RiotApiService";
import InfoService from "./InfoService";

export default class VariableService {
  /** Gets the value of the given variable for a given server */
  public static getValueForVariable(variableName: string, guildid: string) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();

    /*
    return db.db(guildid).collection("inhouse_players")
      .findOne({ userid: String(userid) });*/
  }
}
