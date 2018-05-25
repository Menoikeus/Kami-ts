import RiotApiService from '../../src/services/RiotApiService';
import { Client, Message, TextChannel, Guild } from "discord.js";
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
const mongodb_config = require('../config/mongo_config.json');

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect;

/*
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;
const should = chai.should();*/

describe('League API tests', () => {
  let summoner;
  let game;

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
    let summoner = await expect(RiotApiService.getSummonerByName("Menoikeus")).to.not.be.rejected;
    expect(summoner.id).to.equal(27740958);
  });

  it('Get ongoing game by userid while no game is in progreses', async () => {
    await expect(RiotApiService.getCurrentGameByUserId("177235182489829376", "test")).to.be.rejected;
  });
  it('Get ongoing game by leagueid while no game is in progreses', async () => {
    await expect(RiotApiService.getCurrentGameByLeagueId("31031782")).to.be.rejected;
  });

  it('Get ongoing game by userid without inhouse account', async () => {
    await expect(RiotApiService.getCurrentGameByUserId("not", "test")).to.be.rejected;
  });

  it('Get finished game by match id', async () => {
    let game = await expect(RiotApiService.getFinishedGameByGameId("2687795498")).to.not.be.rejected;

    expect(game.gameId).to.be.equal(2687795498);
    expect(game.participants.length).to.be.equal(8);
  });
});
