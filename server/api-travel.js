const db = require('./db');
let endReq = require("./endReq")("__cache__/api/travels");

//GET /api/travels
function getTravels(req, res) {
    db.Travels.find({}).exec((e, travels) => res.json(travels.map(doc => doc.toObject())));
}

//POST /api/travels
function saveTravel(req, res) {
    let data = req.body;
    let newTravel = new db.Travels(data);
    newTravel.save(endReq.bind(res));
}

//DELETE /api/travels/:_id
function removeTravel(req, res) {
    db.Travels.remove({_id: req.params._id}).exec(endReq.bind(res)); 
}

module.exports = {
    getTravels,
    saveTravel,
    removeTravel
}