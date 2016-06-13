var db = require('../db');
var sequence_model = require('./internal/sequence')

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('subsidiary').find(
        {}
        , {id: 0}
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.exists = function (reference, cb) {
    db.get()
        .collection('subsidiary').find(
        {reference: reference}
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

// Insert new data
exports.add = function (data, user, cb) {
    sequence_model.getSequence('subsidiary', function(error, counter){
        if(error){
            cb(error);
        }else{
            db.get()
                .collection('subsidiary').insertOne({
                    id: counter.value.seq
                    , name: data.name
                    , reference: data.reference
                    , active: data.active
                    , creator: user
                    , created: (new Date()).getTime()
                    , modifier: user
                    , modified: (new Date()).getTime()
                    , deleter: false
                    , deleted: false
                }
                , function (error, result) {
                    cb(error, result);
                });
        }
    });
}

// Update existent data
exports.update = function (id, data, cb) {

}

//delete data
exports.delete = function (id, cb) {

}