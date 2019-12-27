const _       = require("underscore");
let db        = require("./db");
const config = require('../config');

const utils  = require('./utils');
let _obj     = utils._obj;
let _endPost = require("./endReq")("__cache__/api/weeks");

//GET /[:name]
function renderWol(req, res) {
    res.render("wol/wol-vue.html", config.serverParams());
}

// GET /test/wol
function renderTestWol(req, res) {
    res.render("wol/wol-vue.html", require("./test_data/wol_data"));
}

//GET /api/wol/weeks
function getWeeks(req, res) {
    let data = {};
    let name = config.NAME;
    db.People
    .findOne({name})
    .exec((e, doc) => {
        if (!e && doc) {
            data = doc.toObject();
            db.Weeks.find({name})
            .exec((e1, weeks) => {
                if (!e1 && weeks) {
                    data.weekInfo = {};
                    weeks.map(_obj).forEach((wk) => {
                        data.weekInfo[wk.weekNum] = wk;
                    });
                    res.json(data);
                } else {
                    res.status(500).send("db.Weeks.find error");
                }
            });
        }
        else {
            res.status(500).send("db.People.find error");
        }
    });
}

// POST /api/wol/weeks
function saveWeek(req, res) {
    let body = req.body;
    db.Weeks.findOneAndUpdate({
        weekNum: body.weekNum
    }, body, {"upsert": true})
    .exec(_endPost.bind(res))
}

//GET /test
function test(req, res) {
    res.send("test");
}

//GET /login
function renderLogin(req, res) {
    res.render("login/login-vue.html", config.serverParams());
}

module.exports = {
    renderWol,
    renderTestWol,
    getWeeks,
    saveWeek,
    test,
    renderLogin
};

//create    add
//read      get
//update    save
//delete    remove