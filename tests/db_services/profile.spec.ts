import ProfileService from '../../src/services/ProfileService';
import { MongoDatabaseProvider } from '../../src/services/MongoDBService';
import { expect } from 'chai';
import 'mocha';
const mongodb_config = require('../../dist/config/mongodb/mongo_config.json');

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

  it('Profile getting by id and guild id', async () => {
    let user = await ProfileService.getUserProfileById("177207819710365696","test");
    expect(user).not.null;
  });
  it('Check profile properties', async () => {
    let user = await ProfileService.getUserProfileById("177207819710365696","test");
    expect(user._id).not.null;
    expect(user.userid).equals("177207819710365696");
    expect(user.level).not.null;
    expect(user.exp).not.null;
  });

  after(function() {
    MongoDatabaseProvider.close();
  });
});
