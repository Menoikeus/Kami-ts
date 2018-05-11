import GuildService from '../../src/services/GuildService';
import InfoService from '../../src/services/InfoService';
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
import { MongoClient } from 'mongodb';
import { expect } from 'chai';
import 'mocha';
const mongodb_config = require('../config/mongo_config.json');

describe('Guild service tests', () => {
  // Connect to database
  before(function (done) {
    this.timeout(5000);
    MongoDatabaseProvider.connectToDatabase(
      mongodb_config.user,
      mongodb_config.password,
      mongodb_config.url).then(async () => {
        // Drop the creation test database
        let db: MongoClient = MongoDatabaseProvider.getDatabase();
        await db.db("temp").dropDatabase();
        done();
      }).catch(() => {
        done(new Error("Failed to connect to database"));
      });
  });

  it('Add guild to database', async () => {
    let guild = {
      id: "temp",
      members: []
    }

    await GuildService.addGuildToDatabase(guild as any);
    let directory_info = await InfoService.getInfoCollection(guild.id).findOne({ info_type: "directory_info" });
    let inhouse_info = await InfoService.getInfoCollection(guild.id).findOne({ info_type: "inhouse_info" });
    expect(directory_info).to.exist;
    expect(inhouse_info).to.exist;
  });
});
