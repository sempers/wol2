const cons = require('consolidate')
    , http = require('http')
    , path = require('path')
    , express = require('express')
    , bodyParser = require('body-parser')
    , morgan = require('morgan')
    , favicon = require('serve-favicon')
    , cookieSession = require("cookie-session")
    , db = require('./db')
    , api_wol = require('./api-wol')
    , api_money = require('./api-money')
    , api_msg = require('./api-msg')
    , api_travel = require('./api-travel');


const app = express();

app.engine("html", cons.ejs);
app.set('view engine', 'html');
app.set("views", path.resolve(__dirname, '../client'));
app.set('trust proxy', 1);

app.use(express.static(path.resolve(__dirname, '../client'), {
    etag: false
}));

app.use(bodyParser.json());
app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use(morgan('common'));
app.use(cookieSession({
    name: 'session',
    keys: ["29b6BCZ*1q"],
    maxAge: 30 * 24 * 60 * 60 * 1000
}));

//html
app.get("/serverParams.js", api_wol.renderServerParams);
app.get("/login", api_wol.renderLogin);

/*app.get("/wol", api_wol.renderWol);
app.get("/login", api_wol.renderLogin);
app.get("/test/wol", api_wol.renderTestWol);
app.get("/test/money", api_money.mwRates, api_money.testMoney);
app.get("/money", api_money.renderMoney);
app.get("/msg", api_msg.renderMsg);
app.get("/:name", api_wol.renderWol);*/

//API
//wol
app.get("/api/wol/weeks", api_wol.getWeeks);
app.post("/api/wol/weeks",  api_wol.saveWeek);

//travel
app.get("/api/travels", api_travel.getTravels);
app.post("/api/travels",  api_travel.saveTravel);
app.delete("/api/travels/:_id", api_travel.removeTravel);

//money
app.get("/api/money/rates", api_money.mwRates, api_money.getRates);
app.get("/api/money/histRates", api_money.getHistRates);
app.get("/api/money/currentRates", api_money.getCurrentRates);
app.get("/api/money/saveCurrentRates", api_money.saveCurrentRates); //test
app.post("/api/money/tx", api_money.addTx);
app.put("/api/money/tx", api_money.saveTx);
app.delete("/api/money/tx/:_id", api_money.removeTx);
app.post("/api/money/tags", api_money.addPt);
app.put("/api/money/tags", api_money.savePt);
app.post("/api/money/tags/rename", api_money.renamePt);
app.delete("/api/money/tags/:_id", api_money.removePt);
app.post("/api/money/accounts", api_money.addAcc);
app.post("/api/money/accounts/rename", api_money.renameAcc);
app.put("/api/money/accounts", api_money.saveAcc);
app.post("/api/money/rates", api_money.saveRates);
app.get("/api/money", api_money.mwRates, api_money.getMoney);    //allInfo

//messages
app.get("/api/msg/chats", api_msg.getMsgsByChats);
app.get("/api/msg/chats_stats", api_msg.getChatStats);
app.get("/api/msg/calc", api_msg.calcMsgCount);
app.get("/api/msg/correct", api_msg.correctChats);
app.get("/api/msg/correctNull", api_msg.correctNull); //test
app.get("/api/msg/rules", api_msg.getRules);
app.post("/api/msg/addRule", api_msg.addRule);
app.post("/api/msg/removeRule", api_msg.removeRule);
app.post("/api/msg/saveSex/:chat", api_msg.saveSex);
app.post("/api/msg/deleteMessage", api_msg.deleteMessage);
app.get("/api/msg/chat/:chat", api_msg.getChat);
app.get("/api/msg/:weekNum", api_msg.getWeekMessages);

app.get("/", api_wol.renderIndex);
app.get("/:name", api_wol.renderIndex);

//default
/*app.get("/", api_wol.renderWol);
app.get("/money", api_wol.renderWol);*/

db.connect();

const httpPort = process.env.PORT || 3000;
const server = http.createServer(app).listen(httpPort, () => console.log(`WoL server [for name: ${process.env.NAME}] is working on port ${httpPort}`));
server.setTimeout(30 * 60 * 1000);