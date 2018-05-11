import InhouseService from '../../src/services/InhouseService';
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
import { expect } from 'chai';
import 'mocha';
const mongodb_config = require('../config/mongo_config.json');

describe('Inhouse service tests (profiles)', () => {
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
    expect(profile.leagueid).to.equal(27740958);
  });

  it('Inhouse profile creation with existing profile + leagueid', async () => {
    let profile = await InhouseService.getInhouseProfileByDiscordId("177207819710365696", "temp");
    expect(profile).to.exist;
    expect(profile.leagueid).to.equal(27740958);

    expect(async () => await InhouseService.updateInhouseProfile("177207819710365696", "temp", "dtwizzledante")).to.throw;
  });

  it('Inhouse profile creation with existing leagueid', async () => {
    let profile = await InhouseService.getInhouseProfileByDiscordId("177207819710365696", "temp");
    expect(profile).to.exist;
    expect(profile.leagueid).to.equal(27740958);

    expect(async () => await InhouseService.createInhouseProfile("190173937181655040", "temp", "dtwizzledante")).to.throw;
  });

  it('Inhouse profile getting by discord id', async () => {
    let user = await InhouseService
      .getInhouseProfileByDiscordId("177207819710365696","test");
    expect(user).not.null;
    expect(user.leagueid).equals("27740958");
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

  after(function() {
    MongoDatabaseProvider.close();
  });
});
