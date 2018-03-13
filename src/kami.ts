import { Bot } from "./Bot";
const kamiConfig = require('./config/kami_config.json');

let bot: Bot = new Bot(kamiConfig.token);
