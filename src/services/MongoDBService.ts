import { MongoClient, Collection } from "mongodb";

export class MongoDatabaseProvider {
  static db: MongoClient;

  public static connectToDatabase(user: string, password: string, databaseUrl: string): Promise<MongoClient> {
    const uri = "mongodb://" + user + ":" + password + "@" + databaseUrl;

    MongoDatabaseProvider.close();
    return new Promise((resolve, reject) => {
      MongoClient.connect(uri, function(error, client) {
        if(error) {
          reject(new Error("Database connection failed"));
        }
        MongoDatabaseProvider.db = client;
        resolve(MongoDatabaseProvider.db);
      });
    });
  }

  public static getDatabase(): MongoClient {
    if(this.db === undefined) {
      throw new Error("No connection has been established with any database yet!");
    }
    return this.db;
  }

  public static close(): void {
    try {
      this.db.close();
    }
    catch(error) {

    }
  }
}
