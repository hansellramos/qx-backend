var db = require('../db');

exports.all = function (cb) {
    db.get()
        .collection('permission').aggregate([])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}