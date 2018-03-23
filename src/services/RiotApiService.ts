const LeagueJS = require('leaguejs');
const lolapi_config = require('../config/lolapi/config_lolapi.json');

export default class RiotApiService {
  static lolapi = new LeagueJS(lolapi_config.apiKey);

  public static async getSummonerByName(name: string) {
    try{
      return await RiotApiService.lolapi.Summoner.gettingByName(name);
    }
    catch(error) {
      RiotApiService.catchSummonerError(error);
    }
  }

  public static catchSummonerError(error) {
    switch(error.statusCode) {
      case 400: console.log("lolapi error " + error.statusCode + ": Bad Request");
        throw new Error("I don't know why, but something broke.");
      case 403: console.log("lolapi error " + error.statusCode + ": Forbidden");
          throw new Error("Looks like the api key currently isn't working. Please tell the dev.");
      case 404: console.log("lolapi error " + error.statusCode + ": Summoner not found");
        throw new Error("That summoner name does not exist!");
      case 429: console.log("lolapi error " + error.statusCode + ": Too many requests");
        throw new Error("There's been too many requests! Please try again in a moment.");
      case 500:
      case 502:
      case 503:
      case 504:
        console.log("lolapi error " + error.statusCode + ": Server unreachable");
        throw new Error("Riot's servers seem to be unreachable right now.");
      default:
        console.log(error);
        throw new Error("Unexpected error");
    }
  }
}
