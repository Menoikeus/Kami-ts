import { Message, Client, User, Guild } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import InfoService from './InfoService';
import StatisticsService from './StatisticsService';

export default class OutputService {
  static client: Client;
  static globalInhouseInfo;

  static blankSpaceEmoji;
  static greenUpEmoji;
  static redDownEmoji;

  static kdaEmoji;
  static redTeamIcon;
  static blueTeamIcon;
  static lolEmoji;

  static winEmoji;
  static loseEmoji;

  public static async setupOutputService(client: Client) {
    this.client = client;
    this.globalInhouseInfo = await InfoService.getGlobalInhouseInfo();

    this.blankSpaceEmoji = `${this.client.emojis.get('400562773387378688')}`;
    this.greenUpEmoji = `${this.client.emojis.get('448710822584385546')}`;
    this.redDownEmoji = `${this.client.emojis.get('448710836492566529')}`;

    this.kdaEmoji = `${this.client.emojis.get('448659478997630976')}`;
    this.redTeamIcon = `${this.client.emojis.get('448642956182683648')}`;
    this.blueTeamIcon = `${this.client.emojis.get('448643034943586315')}`;
    this.lolEmoji = `${this.client.emojis.get('448914381888159744')}`;

    this.winEmoji = `${this.client.emojis.get('448921328599302176')}`;
    this.loseEmoji = `${this.client.emojis.get('448921473177092106')}`;
  }

  /** Gets the inhouse info of a specified guild */
  public static async outputMatch(match): Promise<Object> {
    // See who won
    const blueTeamWin: boolean = match.winning_team === 100;

    // Create new arrays for each stat type
    const StatType = Object.freeze({"name":0, "kda":1, "cs":2, "elo_change":3});
    var team_1 = [];
    var team_2 = [];
    for(var i = 0; i < Object.keys(StatType).length; i++) {
      team_1[i] = new Array();
      team_2[i] = new Array();
    }

    match.players.forEach((player) => {
      const championId = player.championId;

      // Emoji stuff
      const champEmojiIcon = OutputService.getEmojiByChampId(championId);

      // Get their name
      let name_text: string = champEmojiIcon + " ";
      if(player.userid === undefined) {
        name_text += "---";
      }
      else {
        name_text += this.client.users.get(player.userid).username;
      }

      // Get their stats
      const kda = this.blankSpaceEmoji + player.stats.kills + " / " + player.stats.deaths + " / " + player.stats.assists + this.blankSpaceEmoji;
      const creepScore = player.stats.totalMinionsKilled + this.blankSpaceEmoji;
      const eloChange = this.blankSpaceEmoji + " " + (player.userid === undefined ? ("\u200b") : (player.elo_delta + (player.elo_delta >= 0 ? this.greenUpEmoji : this.redDownEmoji)));

      // Load the stats into the appropriate array
      if(player.teamId == 100) {
        team_1[StatType.name].push(name_text);
        team_1[StatType.kda].push(kda);
        team_1[StatType.cs].push(creepScore);
        team_1[StatType.elo_change].push(eloChange);
      }
      else {
        team_2[StatType.name].push(name_text);
        team_2[StatType.kda].push(kda);
        team_2[StatType.cs].push(creepScore);
        team_2[StatType.elo_change].push(eloChange);
      }
    });

    const match_date = new Date(match.date);
    const embed = {
      "title": this.lolEmoji + " Match " + match.matchid + " on " + (match_date.getMonth()+1) + "/" + match_date.getDate() + "/" + match_date.getFullYear(),
      "description": "Match ended with " + (match.winning_team == 100 ? "Blue" : "Red") + " team victory",
      "color": 16777215,
      "footer": {
        "text": match_date.toString(),
      },
      "fields": [
        {
          "name": this.blueTeamIcon + "Blue Team",
          "value": team_1[StatType.name].join("\n"),
          "inline": true
        },
        {
          "name": this.kdaEmoji + "KDA",
          "value": team_1[StatType.kda].join("\n"),
          "inline": true
        },
        {
          "name": (blueTeamWin ? this.winEmoji : this.loseEmoji) + " Elo Change",
          "value": team_1[StatType.elo_change].join("\n"),
          "inline": true
        },
        {
          "name": this.redTeamIcon + "Red Team",
          "value": team_2[StatType.name].join("\n"),
          "inline": true
        },
        {
          "name": this.kdaEmoji + "KDA",
          "value": team_2[StatType.kda].join("\n"),
          "inline": true
        },
        {
          "name": (blueTeamWin ? this.loseEmoji : this.winEmoji) + " Elo Change",
          "value": team_2[StatType.elo_change].join("\n"),
          "inline": true
        }
      ]
    };

    return embed;
  }


  /** Gets an emoji by the champion id */
  private static getEmojiByChampId(championId: string) {
    const champEmojiInfo = this.globalInhouseInfo.champion_icons.find(icon => icon.id == championId);
    const champEmoji = this.client.emojis.get(champEmojiInfo.emoji_id);
    return `${champEmoji}`;
  }

  public static async getUserIdByUsername(username: string, guildid: string): Promise<string> {
    // Get the number of octothorpes
    const numberOfHashes: number = (username.match(/#/g) || []).length;
    const guild: Guild = this.client.guilds.get(guildid);

    // There should be only one or no hashes
    if(!(numberOfHashes === 0 || numberOfHashes === 1)) throw new Error("You need to give me a discord username or a discord username with a discriminator!");

    // If there aren't any hashes, then there's only a username
    if(numberOfHashes === 0) {
      // Get all users with the username that the bot has seen
      const usersWithUsername: Array<User> = this.client.users.findAll("username", username);

      // Go through all the users with the username, and check if they're in the guild
      let usersInGuild: Array<User> = [];
      let usersAndDiscriminators: string = "";
      usersWithUsername.forEach((user: User) => {
        if(guild.members.get(user.id)) {
          usersInGuild.push(user);
          usersAndDiscriminators += user.username + "#" + user.discriminator + "\n";
        }
      });

      // If there's no one in that list, then...
      if(usersInGuild.length === 0) throw new Error("There's no one in your guild with that username.");
      // If there's only one, then send it back
      if(usersInGuild.length === 1) return usersInGuild[0].id;

      // Otherwise display an error to the user stating to include the discriminator with their name
      let error: string = "There are multiple people with that username on the server. " +
                          "Please write out their name with their discriminator (e.g. Menoikeus#1234).";
      error += "```" + usersAndDiscriminators + "```";
      throw new Error(error);
    }
    else if(numberOfHashes === 1) {
      // Parse the string
      const usernameConstituents: Array<string> = username.split("#");
      const name = usernameConstituents[0];
      const discriminator = usernameConstituents[1];

      // If the discriminator is not the right format
      if(isNaN(Number(discriminator)) || discriminator.length !== 4) throw new Error("The discriminator should be a four digit number.");

      // Get all users with the username
      const usersWithUsername: Array<User> = this.client.users.findAll("username", name);
      let userWithDiscriminator: User;

      usersWithUsername.forEach((user) => {
        if(user.discriminator == discriminator && guild.members.get(user.id)) {
          userWithDiscriminator = user;
        }
      });

      if(!userWithDiscriminator) throw new Error("There isn't anyone in your guild with that username + discriminator combination.");

      return userWithDiscriminator.id;
    }
  }

