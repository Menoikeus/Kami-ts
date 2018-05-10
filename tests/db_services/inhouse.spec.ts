import InhouseService from '../../src/services/InhouseService';
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
import { expect } from 'chai';
import 'mocha';
const mongodb_config = require('../config/mongo_config.json');

describe('Profile service tests', () => {
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

  it('Inhouse rofile getting by discord id and guild id', async () => {
    let user = await InhouseService
      .getInhouseProfileByDiscordId("177207819710365696","test");
    expect(user).not.null;
    expect(user.leagueid).equals("27740958");
  });
  it('Inhouse rofile getting by profile id and guild id', async () => {
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
