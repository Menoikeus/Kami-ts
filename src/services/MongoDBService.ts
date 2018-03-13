import { MongoClient, Collection } from "mongodb";

export class MongoDatabaseProvider {
  private static db: MongoClient;

  constructor(user: string, password: string, databaseUrl: string) {
    const uri = "mongodb://" + user + ":" + password + "@" + databaseUrl;

    MongoClient.connect(uri, function(error, client) {
      MongoDatabaseProvider.db = client;
      console.log("Database connection established!");
    });
  }
}
