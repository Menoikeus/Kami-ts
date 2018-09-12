import Tree from "../data_structures/Tree";
import { Message, Client, Guild, GuildMember } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import InfoService from './InfoService';
import ProfileService from './ProfileService';
import InhouseService from "./InhouseService";

export default class GuildService {
  /** Gets the profile for a specific user within a guild through the user's
      and guild's ids */
  public static async addGuildToDatabase(guild: Guild) {
    let db: MongoClient = MongoDatabaseProvider.getDatabase();
    let guildid = guild.id;

    let existingServer = await InfoService.getDirectoryInfo(guildid);
    if(existingServer) return;

    let infoCollection: Collection = InfoService.getInfoCollection(guildid);
    // inserting server-specific information
		const server_info = {
			info_type : "directory_info",
			s_prefix	:	"k!"
		}

    // Insert inhouse info
    const inhouse_info = {
			info_type          	  : "inhouse_info",
			start_date 						: (new Date()).getTime(),
			i_volatility_constant : Number(400),
			i_minimum_players     : Number(4),
      i_max_imbalance       : Number(1),
			i_default_elo         : Number(2500),
			b_anyone_can_reassign : false,
			b_same_starting_rank  : true
		}

    // Do the insertion
    await infoCollection.insertMany([server_info, inhouse_info]);
    console.log('New server ID: ' + guildid + ' added');

    // Create indices on matches
    await InhouseService.getInhouseMatchesCollection(guildid).createIndex({ date: -1 });

    // Add members to the server
    GuildService.addMembersToServer(guild);
  }

  private static addMembersToServer(guild: Guild): void {
    guild.members.forEach((member: GuildMember) => {
      let username: string = member.user.username;
      let userid: string = member.user.id;
      let guildid: string = member.guild.id;

      ProfileService.createProfileInServer(username, userid, guildid);
    });
  }
}
