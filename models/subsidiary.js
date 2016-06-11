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

exports.exists = function(reference, cb){
    console.log({reference:reference});
    db.get()
        .collection('subsidiary').find(
            { reference:reference }
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.save = function(data, cb){

}