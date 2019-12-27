const db = require('./db');

let _endPost = require("./endReq")("__cache__/api/travels");

//GET /api/travels
function getTravels(req, res) {
    db.Travels.find({}).exec((e, travels) => res.json(travels.map(_obj)));
}

//POST /api/travels
function saveTravel(req, res) {
    let data = req.body;
    db.Travels.update({_id: data._id}, data, {upsert: true}).exec(_endPost.bind(res));
}

//DELETE /api/travels/:_id
function removeTravel(req, res) {
    db.Travels.remove({_id: req.params._id}).exec(_endPost.bind(res)); 
}

module.exports = {
    getTravels,
    saveTravel,
    removeTravel
};