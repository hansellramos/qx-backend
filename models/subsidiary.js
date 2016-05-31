var db = require('../db');

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('subsidiary').find(
        {}
        , {id:0}
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}