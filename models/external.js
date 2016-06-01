var db = require('../db');

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('external').find(
        {}
        , {id:0}
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}