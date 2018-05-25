import { Message, Client, User, Guild } from "discord.js";
import { MongoClient, Collection } from 'mongodb';
import { MongoDatabaseProvider } from './MongoDBService';
import InfoService from './InfoService';
import StatisticsService from './StatisticsService';
import InhouseService from "./InhouseService";

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

  /** Sets up all the emojis and variables for the output service */
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

  /** Formats a match into discord embed form */
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

  /** Outputs a profile and its statistics in discord embed form */
  public static async outputInhouseProfile(profile, guildid: string): Promise<Object> {
    const userid = profile.userid;
    const user: User = this.client.users.get(userid);
    const globalInhouseInfo = await InfoService.getGlobalInhouseInfo();

    // Get match statistics (first of aggregate data averaged, then of most recent 3 games)
    const statistics = await StatisticsService.getInhouseProfileStatisticsByUserId(userid, guildid);
    const recentMatches = await StatisticsService.getRecentMatchDataByUserId(userid, guildid);

    // Create the output for the aggregate data
    let statsOutput: string = "";
    if(statistics && statistics.matchesPlayed != 0) {
      statsOutput +=
        "**KDA:**   " +
        statistics.averageKills.toFixed(1) + " / " +
        statistics.averageDeaths.toFixed(1) + " / " +
        statistics.averageAssists.toFixed(1) + "\n" +
        "**W/L:**   " + (statistics.totalWins / statistics.matchesPlayed * 100).toFixed(1) + "%\n" +
        "**Games:**   " + statistics.matchesPlayed;
    }

    // Format the output for the last three matches
    let mostRecentChampion: string;
    let matchOutput: string = "";
    recentMatches.forEach((match) => {
      const championEmoji: string = OutputService.getEmojiByChampId(match.championId);

      const champion: any = globalInhouseInfo.champion_icons.find((icon) => { return icon.id == match.championId });
      const kda: string = match.stats.kills + "/" + match.stats.deaths + "/" + match.stats.assists;
      const win: string = "**" + (match.win ? this.winEmoji : (this.loseEmoji)) + "**";
      const matchid: string = match.matchid;

      matchOutput += "**" + matchid + "** | " + win + " - " + championEmoji + " " + champion.name + ": " + kda + "\n";

      mostRecentChampion = mostRecentChampion || champion.stripped_name;
    });

    // Set the thumbnail image to their most recently played champion
    let imageUrl: string;
    if(mostRecentChampion) {
      imageUrl = "http://ddragon.leagueoflegends.com/cdn/" + globalInhouseInfo.i_data_dragon_version + "/img/champion/" + mostRecentChampion + ".png";
    }
    else {
      imageUrl = this.client.guilds.get(guildid).iconURL || "https://i.imgur.com/vfBewGB.png";
    }

    // Set player icon url
    let playerAvatarUrl: string = user.avatarURL || "https://i.imgur.com/vfBewGB.png";

    // create embed
    const embed = {
      "color": 16777215,
      "author": {
        "name": user.username + "#" + user.discriminator,
        "icon_url": playerAvatarUrl,
        "url": "http://www.lolking.net/summoner/na/" + profile.leagueid
      },
      "thumbnail": {
        "url": imageUrl,
      },
      "fields": [
        {
          "name": "Discord ID",
          "value": profile.userid
        },
        {
          "name": "League ID",
          "value": profile.leagueid,
          "inline": true
        },
        {
          "name": "Elo",
          "value": profile.elo,
          "inline": true
        },
        {
          "name": "Stats",
          "value": statsOutput || "-"
        },
        {
          "name": "Recent Matches",
          "value": matchOutput || "-",
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

  /** Generates and formats a table, given arrays of left and right elements.
      @param left
        The left array
      @param right
        The right array
      @param spaces
        The spaces between the columns
      @param cutoffLength
        How far to go (in number of characters) before breaking into a new line */
  public static generateTables(left: Array<string>, right: Array<string>, spaces: number = 5, cutoffLength: number = 30) {
    if(left.length != right.length) throw new Error("The left and right columns have differing lengths");
    if(left.length == 0) throw new Error("There's nothing in the arrays!");

    // Get the max length of any left element
    let maxLength: number = 0;
    for(let i in left) {
      maxLength = left[i].length > maxLength ? left[i].length : maxLength;
    }

    // Add trailing spaces to match the highest entry length + spaces parameter
    for(let i in left) {
      const spacesToAdd: number = maxLength + spaces - left[i].length;
      left[i] += Array(spacesToAdd + 1).join(" ");
    }

    const distancesFromLeft = maxLength + spaces + 1;
    // Add new lines when an entry in the right column overflows the cutoffLength
    for(let i in right) {
      let newLines: string = "";
      const words: Array<string> = right[i].split(" ");

      // Make sure we don't add spaces if it's the first row
      let firstLine: boolean = true;

      let currentLine: string = "";
      for(let j in words) {
        // Check if we've reached the overflow limit
        if(currentLine.length + words[j].length > cutoffLength) {
          if(!firstLine) {
            newLines += Array(distancesFromLeft).join(" ");
          }
          else {
            // Don't add pad spacing if its the first line
            firstLine = false;
          }

          // Add the current line to the list of lines, with a line break
          newLines += currentLine + "\n";
          // Set the current line to the word
          currentLine = words[j] + " ";
        }
        else {
          currentLine += words[j] + " ";
        }
      }

      // Add the trailing line to the list of lines, if there's anything in it
      if(currentLine.trim() !== "") {
        newLines += (firstLine ? "" : Array(distancesFromLeft).join(" ")) + currentLine + "\n";
      }

      right[i] = newLines;
    }

    let output = "";
    for(let i in left) {
      output += left[i] + right[i];
    }
    return "```" + output + "```";
  }

  /** Display a list of matches in condensed format */
  public static async outputMatchList(matches: Array<any>): Promise<any> {
    let idList: Array<string> = [];
    let winnerList: Array<string> = [];
    let dateList: Array<string> = [];
    matches.forEach((match) => {
      let teamEmoji = match.winning_team == 100 ? this.blueTeamIcon : this.redTeamIcon;
      let teamText = match.winning_team == 100 ? "Blue Team" : "Red Team";

      idList.push("**" + match.matchid + "**");
      winnerList.push(teamEmoji + match.winning_team);
      dateList.push((new Date(match.date)).toLocaleDateString());
    });

    const embed = {
      "title": this.lolEmoji + " Recent matches",
      "description": "Completed matches for your inhouse league",
      "color": 16777215,
      "fields": [
        {
          "name": "Match Ids",
          "value": idList.join(this.blankSpaceEmoji + "\n") || "-",
          "inline": true
        },
        {
          "name": "Winning Team",
          "value": winnerList.join("\n") || "-",
          "inline": true
        },
        {
          "name": "Date Played",
          "value": dateList.join(this.blankSpaceEmoji + "\n") || "-",
          "inline": true
        },
      ]
    };

    return embed;
  }

  public static async outputLeagueInformation(guildid: string) {
    // Get the top players from the league
    const topPlayers = await InhouseService.getInhouseProfileCollection(guildid).find().sort({ elo: -1 }).limit(5).toArray();

    // Get the most recent 3 games
    const matches = await InhouseService.getInhouseMatchesCollection(guildid)
      .find({ completed: true })
      .limit(3)
      .sort({ date: -1 })
      .toArray();

    // Get the inhouse league creation date
    const dateCreated = (await InfoService.getInhouseInfo(guildid)).start_date;

    // Get the guild Object
    const guild: Guild = this.client.guilds.get(guildid);

    // Format the output
    let topPlayersOutput: Array<string> = [];
    let counter = 0;
    topPlayers.forEach((player) => {
      topPlayersOutput.push("**[" + (counter+1) + "]:**  " + guild.members.get(player.userid).user.username + " - " + player.elo);
      counter++;
    });

    let matchesOutput: Array<string> = [];
    matches.forEach((match) => {
      matchesOutput.push("**" + match.matchid + " | ** " + (new Date(match.date)).toLocaleDateString());
    });

    // create embed
    const embed = {
      "color": 16777215,
      "author": {
        "name": guild.name + " Inhouse League",
        "icon_url": "https://i.imgur.com/vfBewGB.png",
      },
      "thumbnail": {
        "url": guild.iconURL || "https://i.imgur.com/vfBewGB.png",
      },
      "fields": [
        {
          "name": "Date Created",
          "value": (new Date(dateCreated)).toDateString() + this.blankSpaceEmoji,
        },
        {
          "name": "Top Players",
          "value": topPlayersOutput.join(this.blankSpaceEmoji + "\n") || "-",
          "inline": true
        },
        {
          "name": "Recent Matches",
          "value": matchesOutput.join(this.blankSpaceEmoji + "\n") || "-",
          "inline": true
        }
      ]
    };

    return embed;
  }
}
