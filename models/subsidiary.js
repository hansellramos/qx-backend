var db = require('../db');

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('subsidiary').find(
        {}
        , {id:1, name:1, reference:1, _id:0}
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}