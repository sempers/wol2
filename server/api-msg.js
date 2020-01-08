const util = require("util");
const _    = require("underscore");
const os   = require('os');
let db     = require("./db");
const config = require("./config");

let _obj     = require('./utils')._obj;
let _endPost = require("./endReq")();

//html
function renderMsg(req, res) {
    res.render("msg/msg-vue.html", config.serverParams());
}

//GET /api/msg/chats
function getMsgsByChats(req, res) {
    db.Messages.aggregate({
            "$group": {
                "_id": "$chat",
                "cnt": {"$sum": 1},
                "min": {"$min": "$week"},
                "max": {"$max": "$week"}
            }
        }, {$sort: {cnt: -1}},
        function (err, docs) {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        });
}

//GET /api/msg/chats_stats
function getChatStats(req, res) {
    db.Chats.find({}).exec((err, docs) => {
        if (err) {
            res.json(err);
        } else {
            res.json(docs.map(_obj));
        }
    });
}

//POST /api/msg/saveSex/:chat
function saveSex(req, res) {
    let name = req.params.chat;
    let sex = req.body.sex;
    db.Chats.update({name}, {$set: {sex}}, {"upsert": true}).exec(_endPost.bind(res));
}

//GET /api/msg/rules
function getRules(req, res) {
    db.MessagesRules.find({}, (err, docs) => {
        if (err)
            res.json(err);
        else
            res.json(docs.map(_obj));
    });
}

//POST /api/msg/addRule
function addRule(req, res) {
    const nRule = new db.MessagesRules(req.body);
    nRule.save(_endPost.bind(res));
}

//POST /api/msg/removeRule
function removeRule(req, res) {
    const _id = req.body._id;
    db.MessagesRules.remove({_id}).exec(_endPost.bind(res));
}

//POST /api/msg/correct
function correctChats(req, res) {
    db.MessagesRules.find({}, function (err, rules) {
        if (err)
            throw err;
        let _rules   = rules.map(_obj);
        let _matches = _rules.map(o => o.match);

        db.Messages.find({"chat": {"$in": _matches}}, function (err, docs) {
            if (err) {
                throw err;
            }

            let lastMatch = _rules.length > 0 ? _rules[_rules.length - 1].match : null;

            _rules.forEach(r => {
                db.Messages.updateMany({"chat": r.match},
                    {"$set": {"chat": r.target}})
                .exec((err) => {
                    if (err)
                        throw err;
                    if (r.match === lastMatch) {
                        res.json("OK");
                    }
                });
            });
        });
    });
}

//correcting errors one-time
function correctNull(req, res) {
    db.Messages.find({"chat": null}, function (err, docs) {
        if (err)
            throw err;

        let lastDocId = docs[docs.length - 1].toObject()._id;

        docs.forEach(doc => {
            let _doc = doc.toObject();
            if (_doc.isin) {
                doc.update({$set: {"chat": _doc.sndr}}).exec(() => {
                    if (_doc._id == lastDocId)
                        res.json("OK");
                });
            } else {
                doc.update({$set: {"chat": _doc.rcvr}}).exec(() => {
                    if (_doc._id == lastDocId)
                        res.json("OK");
                });
            }
        });
    });
}

//GET /api/msg/chat/:chat
function getChat(req, res) {
    let chat = req.params.chat;
    db.Messages.find({chat})
    .limit(1000)
    .sort({date: 1})
    .exec((err, docs) => {
        if (!err && docs) {
            res.json(docs.map(_obj));
        } else {
            res.json([err]);
        }
    });
}

//GET /api/msg/:weekNum
function getWeekMessages(req, res) {
    let weekNum = +(req.params.weekNum || 1);
    if (isNaN(weekNum)) {
        res.json([]);
        return;
    }
    db.Messages
    .find({week: weekNum})
    .sort({date: 1})
    .exec((err, docs) => {
        if (!err && docs) {
            let grouped = _.groupBy(docs.map(_obj), (d) => d.chat);
            let sorted  = _.sortBy(Object.keys(grouped).map((key) => {
                return {chat: key, messages: grouped[key]};
            }), (c) => -c.messages.length);
            res.json(sorted);
        } else {
            res.json([]);
        }
    });
}

//GET /api/msg/msgCount
function calcMsgCount(req, res) {
    let cursor = db.Messages.aggregate({$group: {_id: '$week', cnt: {$sum: 1}}}).cursor({batchSize: 100}).exec();
    cursor.each((err, doc) => {
        doc && db.Weeks.update({name: 'alex', weekNum: doc._id}, {$set: {msgCount: doc.cnt}})
        .exec(() => console.log("weekNum " + doc._id + ": " + doc.cnt + " msg updated"));
    });
    res.json("OK");
}

function deleteMessage(req, res) {
    let _id = req.body._id;
    db.Messages.remove({_id}).exec(_endPost.bind(res));
}

module.exports = {
    renderMsg,
    getMsgsByChats,
    getWeekMessages,
    calcMsgCount,
    correctChats,
    getRules,
    addRule,
    removeRule,
    deleteMessage,
    correctNull,
    getChat,
    getChatStats,
    saveSex
};