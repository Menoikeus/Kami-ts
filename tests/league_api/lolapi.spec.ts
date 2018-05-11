import RiotApiService from '../../src/services/RiotApiService';
import { Client, Message, TextChannel, Guild } from "discord.js";
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
const mongodb_config = require('../config/mongo_config.json');
import { expect } from 'chai';
import 'mocha';

describe('League API tests', () => {
  let summoner;

  // Connect to database
  before(function (done) {
    this.timeout(5000);
    MongoDatabaseProvider.connectToDatabase(
      mongodb_config.user,
      mongodb_config.password,
      mongodb_config.url).then(() => {
        done();
      }).catch(() => {
        done(new Error("Failed to connect to database"));
      });
  });

  it('Get summoner by username', async () => {
    expect(summoner = await RiotApiService.getSummonerByName("Menoikeus")).to.not.throw;
    expect(summoner.id).to.equal(27740958);
  });
});
