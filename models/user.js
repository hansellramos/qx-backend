var db = require('../db');

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('user').find(
        {}
        , {_id:0}
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (id, cb) {
    db.get().collection('user')
        .findOne({id: id}, {_id:0}, cb);
}