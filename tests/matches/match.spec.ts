import InhouseService from '../../src/services/InhouseService';
import MatchService from '../../src/services/MatchService';
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
import 'mocha';
const mongodb_config = require('../config/mongo_config.json');

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import InfoService from '../../src/services/InfoService';
chai.use(chaiAsPromised)
const expect = chai.expect;

describe('Inhouse match tests', function () {
  const game = require('../data/sample_game_3v3.json');

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

  it("Test inserting unfinished match into database", async () => {
    await MatchService.insertUnfinishedMatchIntoDatabase(game, "temp", {} as any);

    let match: any = await InhouseService.getInhouseMatchByMatchId(game.gameId, "temp");
    expect(match.matchid).to.be.equal(String(game.gameId));
    expect(match.completed).to.be.false;
  });

  it("Test for completing an inhouse match", async () => {
    let inhouseInfo = await InfoService.getInhouseInfo("temp");
    let match: any = await InhouseService.getInhouseMatchByMatchId(game.gameId, "temp");
    await MatchService.checkMatch(match, inhouseInfo, "temp");

    match = await InhouseService.getInhouseMatchByMatchId(game.gameId, "temp");
    expect(match.matchid).to.be.equal(String(game.gameId));
    expect(match.players.length).to.be.equal(6);
    expect(match.completed).to.be.true;
    expect(match.winning_team).to.be.equal(100);
  });

  after(function() {
    MongoDatabaseProvider.close();
  });
});
