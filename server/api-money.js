const https = require("https");
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});
const axios = require("axios");

let db = require("./db");
const async = require("async");
const cache = require("./cache");
const config = require("./config");

let endReq = require("./endReq")("__cache__/api/money");

const TINKOFF_LAG = 15 * 60 * 1000;

// obsolete
function testMoney(req, res) {
    let accounts, pinned_tags, transactions = require("./test_data/money_data.js");
    let rates = req.rates;
    res.render("money/money-vue.html", {
        accounts,
        pinned_tags,
        transactions,
        rates
    });
}

// GET /api/money
function getMoney(req, res) {
    let accounts = [];
    let pinned_tags = [];
    let transactions = [];
    const rates = req.rates;
    async.parallel([
        function (callback) {
            db.Accounts.find({}).exec((err, docs) => {
                callback(null, docs.map(doc => doc.toObject()));
            }).catch(callback);
        },
        function (callback) {
            db.PinnedTags.find({}).exec((err, docs) => {
                callback(null, docs.map(doc => doc.toObject()));
            }).catch(callback);
        },
        function (callback) {
            db.Transactions.find({}).exec((err, docs) => {
                callback(null, docs.map(doc => doc.toObject()));
            }).catch(callback);
        }
    ], function (err, results) {
        if (err) {
            console.error(err);
        }
        accounts = results[0];
        pinned_tags = results[1];
        transactions = results[2];
        res.json({
            accounts,
            pinned_tags,
            transactions,
            rates
        });
    });
}

//GET /api/money/histRates
function getHistRates(req, res) {
    db.HistoricalRates.find({}).exec((err, docs) => {
        if (err) {
            console.log(err);
            res.status(500).send(util.inspect(err));
        } else {
            res.json(docs.map(doc => doc.toObject()));
        }
    });
}

//middleware
function callRates() {
    return new Promise(async (resolve, reject) => {
        const SUPPORTED_CRYPTO = ["BTC", "ETH", "BNB"];
        let currentRates = {
            "YM": 0,
            "RUB": 1.0
        };
        try {
            let iterations = 0;
            while (!currentRates.USD || !currentRates.EUR) {
                const tinkoff_response = await axios.get("https://tinkoff.ru/api/v1/currency_rates/", {
                    timeout: 15000,
                    httpsAgent: httpsAgent
                });
                for (let i = 0; i < tinkoff_response.data.payload.rates.length; i++) {
                    const rate = tinkoff_response.data.payload.rates[i];
                    if (rate.category === "DebitCardsTransfers" && rate.fromCurrency.name === "USD" && rate.toCurrency.name === "RUB") {
                        currentRates.USD = (rate.buy + rate.sell) / 2;
                    } else if (rate.category === "DebitCardsTransfers" && rate.fromCurrency.name === "EUR" && rate.toCurrency.name === "RUB") {
                        currentRates.EUR = (rate.buy + rate.sell) / 2;
                    }
                }
                currentRates.iterations = ++iterations;
            }
            try {
                const cmc_response = await axios.get("https://api.coinmarketcap.com/v1/ticker", {
                    httpsAgent: httpsAgent
                });
                for (let i = 0; i < cmc_response.data.length; i++) {
                    let ticker = cmc_response.data[i];
                    if (SUPPORTED_CRYPTO.indexOf(ticker.symbol) >= 0) {
                        currentRates[ticker.symbol] = +ticker.price_usd * currentRates.USD;
                    }
                }
                currentRates.date = new Date();
                resolve(currentRates);
            } catch (err) {
                reject({
                    error: err,
                    stage: 'calling_coinmarketcap'
                });
            };
        } catch (err) {
            reject({
                error: err,
                stage: 'calling_tinkoff'
            });
        };
    });
}

// Мидлвэр для курсов
async function mwRates(req, res, next) {
    //Get out from cache if there
    let cachedRates = cache.getVal("rates");
    if (cachedRates) {
        req.rates = cachedRates;
        next();
    } else {
        //load historical rates
        try {
            let prevRates = (await db.HistoricalRates.find({}).exec()).map(doc => doc.toObject());
            for (let i = 0; i < prevRates.length; i++) {
                if (prevRates[i].YM === 0) {
                    let now = new Date();
                    let lastDate = prevRates[i].date;
                    if ((now.getTime() - lastDate.getTime()) < TINKOFF_LAG) {
                        req.rates = prevRates;
                        next();
                        return;
                    } else {
                        break;
                    }
                }
            }
            const currentRate = await callRates();
            currentRate.date = new Date();
            //replace or add fresh rates
            let replaced = false;
            for (let i = 0; i < prevRates.length; i++) {
                if (prevRates[i].YM == 0) {
                    prevRates[i] = currentRate;
                    replaced = true;
                    break;
                }
            }
            if (!replaced)
                prevRates.push(currentRate);
            //save fresh rates if only USD and EUR
            if (currentRate.USD && currentRate.EUR) {
                db.HistoricalRates.findOneAndUpdate({
                    "YM": 0
                }, currentRate, {
                    "upsert": true
                }).exec();
                //put in cache
                cache.putVal("rates", prevRates, TINKOFF_LAG); //cache for 30 minutes
            }
            req.rates = prevRates; //adding to request
            next();
        } catch (err) {
            req.rates = prevRates;
            next()
        }
    }
}

//GET /api/money/currentRates
async function getCurrentRates(req, res) {
    let defaultRate = {
        RUB: 1.0
    };
    try {
        res.json(await callRates());
    } catch (error) {
        res.json(Object.assign(defaultRate, error))
    }
}

//GET /api/money/saveCurrentRates
async function saveCurrentRates(req, res) {
    let defaultRate = {
        "YM": 0,
        "RUB": 1.0
    };
    try {
        const currentRate = await callRates();
        currentRate.date = new Date();
        //save fresh rates
        db.HistoricalRates.findOneAndUpdate({
            "YM": 0
        }, currentRate, {
            "upsert": true
        }).exec();
        currentRate.saved = true;
        cache.clearVal("rates");
        res.json(currentRate);
    } catch (error) {
        res.json(Object.assign(defaultRate, error));
    }
}

//GET api/rates
function getRates(req, res) {
    res.json(req.rates);
}

//GET /money
function renderMoney(req, res) {
    res.render("money/money-vue.html", config.serverParams());
}

//------------------Transactions
//DELETE /api/money/tx/:_id
function removeTx(req, res) {
    const _id = req.params._id;
    db.Transactions.remove({
        _id: _id
    }).exec(endReq.bind(res));
}

//POST /api/money/tx
function addTx(req, res) {
    const tx = req.body;
    const nTx = new db.Transactions(tx);
    nTx.save(endReq.bind(res));
}

//PUT /api/money/tx
function saveTx(req, res) {
    const tx = req.body;
    db.Transactions.findOneAndUpdate({
        _id: tx._id
    }, tx, {
        "upsert": true
    }).exec(endReq.bind(res));
}

//Accounts
//POST /api/money/accounts
function addAcc(req, res) {
    const acc = req.body;
    const nAcc = new db.Accounts(acc);
    nAcc.save(endReq.bind(res));
}

//PUT /api/money/accounts
function saveAcc(req, res) {
    const acc = req.body;
    delete acc.__v;
    db.Accounts.findOneAndUpdate({
        _id: acc._id
    }, acc, {
        "upsert": true
    }).exec(endReq.bind(res));
}

//Tags
//POST /api/money/tags
function addPt(req, res) {
    const pt = req.body;
    const npt = new db.PinnedTags(pt);
    npt.save(endReq.bind(res));
}

//PUT /api/money/tags
function savePt(req, res) {
    const pt = req.body;
    delete pt.__v;
    db.PinnedTags.findOneAndUpdate({
        _id: pt._id
    }, pt, {
        "upsert": true
    }).exec(endReq.bind(res));
}

//POST /api/money/tags/rename
function renamePt(req, res) {
    var oldName, newName;
    ({
        oldName,
        newName
    } = req.body);
    db.Transactions.updateMany({
        tag: oldName
    }, {
        $set: {
            tag: newName
        }
    }).exec(endReq.bind(res));
}

//POST /api/money/acconts/rename
function renameAcc(req, res) {
    var oldName, newName;
    ({
        oldName,
        newName
    } = req.body);
    var endCb = endReq.bind(res);
    db.Transactions.updateMany({
        src: oldName
    }, {
        $set: {
            src: newName
        }
    }).exec(function () {
        db.Transactions.updateMany({
            dst: oldName
        }, {
            $set: {
                dst: newName
            }
        }).exec(endCb);
    });
}

//DELETE /api/money/tags/:_id
function removePt(req, res) {
    const _id = req.params._id;
    db.PinnedTags.remove({
        _id: _id
    }).exec(endReq.bind(res));
}

//POST /api/money/rates
function saveRates(req, res) {
    var rates = req.body;
    delete rates._id;
    var now = new Date();
    var ym = (now.getFullYear() % 2000) * 100 + now.getMonth();
    rates.YM = ym;
    db.HistoricalRates.findOneAndUpdate({
        YM: ym
    }, rates, {
        "upsert": true
    }).exec(endReq.bind(res));
}

module.exports = {
    cache,
    getHistRates,
    getCurrentRates,
    saveCurrentRates,
    getRates,
    mwRates,
    testMoney,
    getMoney,
    renderMoney,
    removeTx,
    addTx,
    saveTx,
    addAcc,
    saveAcc,
    addPt,
    savePt,
    renamePt,
    renameAcc,
    removePt,
    saveRates
};



/*db.HistoricalRates.find({}).exec((err, docs) => {
            let prevRates = docs.map(doc => doc.toObject()); //all historical rates
            //check for 15 minutes
            for (let i = 0; i < prevRates.length; i++) {
                if (prevRates[i].YM === 0) {
                    let now = new Date();
                    let lastDate = prevRates[i].date;
                    if ((now.getTime() - lastDate.getTime()) < TINKOFF_LAG) {
                        req.rates = prevRates;
                        next();
                        return;
                    } else {
                        break;
                    }
                }
            }
            callRates().then(rate => {
                    let currentRate = rate;
                    currentRate.date = new Date();

                    //replace or add fresh rates
                    let replaced = false;
                    for (let i = 0; i < prevRates.length; i++) {
                        if (prevRates[i].YM == 0) {
                            prevRates[i] = currentRate;
                            replaced = true;
                            break;
                        }
                    }
                    if (!replaced)
                        prevRates.push(currentRate);
                    //save fresh rates if only USD and EUR
                    if (currentRate.USD && currentRate.EUR) {
                        db.HistoricalRates.findOneAndUpdate({
                            "YM": 0
                        }, currentRate, {
                            "upsert": true
                        }).exec();
                        //put in cache
                        cache.putVal("rates", prevRates, TINKOFF_LAG); //cache for 30 minutes
                    }
                    req.rates = prevRates; //adding to request
                    next();
                })
                .catch(error => {
                    req.rates = prevRates;
                    next();
                }); //end getting new rates
        }); // end getting from database
    } // end checking cache
}*/