const LeagueJS = require('leaguejs');
const lolapi_config = require('../../config/lolapi/config_lolapi.json');
import InhouseService from './InhouseService';

export default class RiotApiService {
  static lolapi = new LeagueJS(lolapi_config.apiKey);

  public static async getSummonerByName(name: string) {
    try {
      return await RiotApiService.lolapi.Summoner.gettingByName(name);
    }
    catch(error) {
      RiotApiService.catchSummonerError(error);
    }
  }

  private static catchSummonerError(error) {
    switch(error.statusCode) {
      case 400: throw new RiotApiError("I don't know why, but something broke.", error.statusCode);
      case 403: throw new RiotApiError("Looks like the api key currently isn't working. Please tell the dev.", error.statusCode);
      case 404: throw new RiotApiError("That summoner name doesn't exist!", error.statusCode);
      case 429: throw new RiotApiError("There's been too many requests! Please try again in a moment.", error.statusCode);
      case 500:
      case 502:
      case 503:
      case 504: throw new RiotApiError("Riot's servers seem to be unreachable right now.", error.statusCode);
      default: console.log(error);
        throw new Error("Unexpected error");
    }
  }

  /************************* Game methods ************************************/
  public static async getCurrentGameByUserId(userid: string, guildid: string) {
    const profile = await InhouseService.getInhouseProfileByDiscordId(userid, guildid);
    if(!profile) throw new Error("You're not in the league! Use '!inhouse add $USERNAME' to add your summoner!");

    return await RiotApiService.getCurrentGameByLeagueId(profile.leagueid);
  }

  public static async getCurrentGameByLeagueId(leagueid: string) {
    try {
      return await RiotApiService.lolapi.Spectator.gettingActiveGame(leagueid);
    }
    catch(error) {
      RiotApiService.catchGameError(error);
    }
  }

  public static async getFinishedGameByGameId(gameid: string) {
    try {
      return await RiotApiService.lolapi.Match.gettingById(gameid);
    }
    catch(error) {
      RiotApiService.catchGameError(error);
    }
  }

  private static catchGameError(error) {
    switch(error.statusCode) {
      case 400: throw new RiotApiError("I don't know why, but something broke.", error.statusCode);
      case 403: throw new RiotApiError("Looks like the api key currently isn't working. Please tell the dev.", error.statusCode);
      case 404: throw new RiotApiError("That game doesn't exist.", error.statusCode);
      case 429: throw new RiotApiError("There's been too many requests! Please try again in a moment.", error.statusCode);
      case 500:
      case 502:
      case 503:
      case 504: throw new RiotApiError("Riot's servers seem to be unreachable right now.", error.statusCode);
      default: console.log(error);
        throw new Error("Unexpected error");
    }
  }
}

class RiotApiError extends Error {
  statusCode: number;

  constructor(message: string, code: number) {
    super(message);
    this.statusCode = code;
  };
}
