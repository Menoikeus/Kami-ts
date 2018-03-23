// Get bot and config
import { Bot } from "./Bot";
import { MongoDatabaseProvider } from "./services/MongoDBService";
const kamiConfig = require('./config/kami_config.json');

// Setup termination functions
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

let bot: Bot = new Bot(kamiConfig.token);

function cleanup():void {
  MongoDatabaseProvider.close();
  console.log("Connection with database closed");
}
