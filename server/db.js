const mongoose = require('mongoose');
const config = require('./config');
const DB_URI = process.env.DB_URI;

mongoose.connection.on('connected', () => console.log('Mongoose connected to ' + DB_URI));
mongoose.connection.on('error', (err) => console.log('Mongoose connection error: ' + err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

let People = mongoose.model("People", new mongoose.Schema({
    name: String,
    birthdate: Date,
    deathdate: Date,
    estimated: Boolean,
    spans: [{
        id: String,
        kind: String,
        name: String,
        start: Date,
        end: Date,
        color: String
    }]
}), "people");

let Weeks = mongoose.model("Weeks", new mongoose.Schema({
    name: String,
    weekNum: Number,
    info: String,
    msgCount: Number
}), "weeks");

let Messages = mongoose.model("Messages", new mongoose.Schema({
    chat: String,
    week: Number,
    isin: Boolean,
    date: Date,
    sndr: String,
    rcvr: String,
    text: String,
    chan: String,
    conf: Boolean,
    hash: String
}), "messages");

let MessagesRules = mongoose.model("MessagesRules", new mongoose.Schema({
    match: String,
    target: String
}), "messages_rules");

//MONEY

let Accounts = mongoose.model("Accounts", new mongoose.Schema({
    f41_id: String,
    name: String,
    created: Date,
    sort: Number,
    currency: String,
    hidden: Boolean,
    details: String,
    startBalance: Number,
    balance: Number,
    type: String,
    special: Boolean
}), "accounts");

let PinnedTags = mongoose.model("PinnedTags", new mongoose.Schema({
    f41_id: String,
    name: String,
    hidden: Boolean,
    created: Date,
    budget: Number,
    budget_type: String,
    expanded: Boolean,
    chart: Boolean,
    color: String
}), "pinned_tags");

let Transactions = mongoose.model("Transactions", new mongoose.Schema({
    f41_id: Number,
    type: String,
    src: String,
    dst: String,
    amount: Number,
    date: Date,
    year: Number,
    month: Number,
    desc: String,
    created: Date,
    edited: Date,
    rate: Number,
    dst_amount: Number,
    tag: String,
    removed: Boolean
}), "transactions");

let HistoricalRates = mongoose.model("HistoricalRates", new mongoose.Schema({
    YM: Number,
    RUB: Number,
    USD: Number,
    EUR: Number,
    BTC: Number,
    ETH: Number,
    BNB: Number,
    date: Date
}), "historical_rates");

let Chats = mongoose.model("Chats", new mongoose.Schema({
    name: String,
    sex: String,
    years: String,
    num: Number
}), "chats");

let Travels = mongoose.model("Travels", new mongoose.Schema({
    lng: Number,
    lat: Number,
    date: String,
    note: String
}), "travels");

function connect() {
    if (config.USE_LOCAL_SERVER) {
        const credentials = { user: process.env.DBUSER, pass: process.env.DBPASSWORD };
        try {
            return mongoose.connect(DB_URI, credentials);
        } catch (e) {
            mongoose.connection && mongoose.connection.close();
            return mongoose.createConnection(DB_URI, credentials);
        }
    } else {
        console.log("DB will not connect, using remote API");
    }    
}

function reset() {
    try { mongoose.connection && mongoose.connection.close(); } catch (e) { }
}

module.exports = {
    People,
    Weeks,
    Messages,
    MessagesRules,
    Accounts,
    PinnedTags,
    Transactions,
    HistoricalRates,
    Chats,
    Travels,
    connect,
    reset,
    connected: false
};



