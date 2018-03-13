import { MongoClient, Collection } from "mongodb";

export class MongoDatabaseProvider {
  static db: MongoClient;

  constructor(user: string, password: string, databaseUrl: string) {
    const uri = "mongodb://" + user + ":" + password + "@" + databaseUrl;

    MongoClient.connect(uri, function(error, client) {
      if(error) {
        throw new Error("Database connection failed");
      }
      MongoDatabaseProvider.db = client;
      console.log("Database connection established!");
    });
  }

  public static getDatabase(): MongoClient {
    if(this.db === undefined) {
      throw new Error("No connection has been established with any database yet!");
    }
    return this.db;
  }
}
