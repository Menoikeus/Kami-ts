import ProfileService from '../../src/services/ProfileService';
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

  it('Profile creation', async () => {
    let member = {
      user: {
        username: "Test",
        id: "313767252984070154"
      },
      guild: {
        id: "temp"
      }
    }
    await ProfileService.createProfileInServer(member.user.id, member.guild.id);
    let user = await ProfileService.getUserProfileById(member.user.id, member.guild.id);
    expect(user).to.exist;
    expect(user.userid).to.equal("313767252984070154");
  });

  it('Profile getting by id and guild id', async () => {
    let user = await ProfileService.getUserProfileById("177207819710365696","test");
    expect(user).not.null;
  });
  it('Check profile properties', async () => {
    let user = await ProfileService.getUserProfileById("177207819710365696","test");
    expect(user._id).not.null;
    expect(user.userid).to.equal("177207819710365696");
    expect(user.level).not.null;
    expect(user.exp).not.null;
  });

  after(function() {
    MongoDatabaseProvider.close();
  });
});
