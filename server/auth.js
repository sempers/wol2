const auth = require("basic-auth");
const util = require('util');
const db = require('./db');

function __unauthorized(req, res, err) {
    req.session = null;
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.status(401).send(err ? err.toString() : "Unknown authorization/db connection error");
}

module.exports = function (req, res, next) {
    if (!db.connected || !req.session.userName) {
        let user = auth(req);

        function authSuccess() {
            req.session.userName = user.name;
            db.connected = true;
            req.next();
        }

        function authError(err) {
            db.reset();
            __unauthorized(req, res, err);
        }

        if (!user || !user.name || !user.pass) {
            return __unauthorized(req, res, "No authentication provided");
        }

        if (db.connected)
            db.Users.findOne({name: user.name, pass: user.pass})
                .exec(function (err, doc) {
                    if (!err && doc != null) {
                        authSuccess();
                    } else {
                        authError(err || "Invalid username/password");
                    }
                });
        else {
            db.connect({user: user.name, pass: user.pass}).then(authSuccess, authError);
        }
    }
    else
        return next();
};
