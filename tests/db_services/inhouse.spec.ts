import InhouseService from '../../src/services/InhouseService';
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
import 'mocha';
const mongodb_config = require('../config/mongo_config.json');

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect;

describe('Inhouse service tests (profiles)', function () {
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

  it('Inhouse profile creation', async () => {
    await InhouseService.updateInhouseProfile("177207819710365696", "temp", "Menoikeus");

    let profile = await InhouseService.getInhouseProfileByDiscordId("177207819710365696", "temp");
    expect(profile).to.exist;
    expect(profile.leagueid).to.equal("27740958");
  });

  it('Inhouse profile creation with existing profile + leagueid', async () => {
    let profile = await InhouseService.getInhouseProfileByDiscordId("177207819710365696", "temp");
    expect(profile).to.exist;
    expect(profile.leagueid).to.equal("27740958");

    await expect(InhouseService.updateInhouseProfile("177207819710365696", "temp", "dtwizzledante")).to.be.rejected;
  });

  it('Inhouse profile creation with existing leagueid', async () => {
    let profile = await InhouseService.getInhouseProfileByDiscordId("177207819710365696", "temp");
    expect(profile).to.exist;
    expect(profile.leagueid).to.equal("27740958");

    await expect(InhouseService.createInhouseProfile("190173937181655040", "temp", "Menoikeus")).to.be.rejected;
  });

  it('Inhouse profile getting by discord id', async () => {
    let user = await InhouseService
      .getInhouseProfileByDiscordId("177207819710365696","test");
    expect(user).not.null;
    expect(user.leagueid).to.equal("27740958");
  });
  it('Inhouse profile getting by summoner id', async () => {
    let user = await InhouseService
      .getInhouseProfileByLeagueId("27740958", "test");
    expect(user).not.null;
    expect(user.userid).equals("177207819710365696");
  });

  it('Getting nonexistent user profile', async () => {
    let user = await InhouseService
      .getInhouseProfileByDiscordId("277409w58", "test");
    expect(user).is.null;
  });
  it('Getting nonexistent inhouse profile', async () => {
    let user = await InhouseService
      .getInhouseProfileByLeagueId("277409w58", "test");
    expect(user).is.null;
    user = await InhouseService
      .getInhouseProfileByDiscordId("277409w58", "test");
    expect(user).is.null;
  });
});

describe('Inhouse game tests', () => {
  const game = require('../data/sample_game_3v3.json');

  it('Finding inhouse players in a custom game', async () => {
    let inhousePlayers = await InhouseService.getAllInhousePlayersInMatch(game, "test");

    inhousePlayers.forEach(player => expect(player.leagueid).to.satisfy(x => x === "27740958" || x === "41230748"));
  });

  it('Getting inhouse match by matchid', async() => {
    let inhouseMatch = await InhouseService.getInhouseMatchByMatchId("2687795498", "test");

    expect(inhouseMatch.matchid).to.be.equal("2687795498");
    expect(inhouseMatch.players.length).to.be.equal(8);
  });

  after(function() {
    MongoDatabaseProvider.close();
  });
});
