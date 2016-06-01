var db = require('../db');
var ObjectID = require('mongodb').ObjectID;

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('product').aggregate([
            {
                $lookup: {
                    from: 'store'
                    , localField: 'store'
                    , foreignField: 'id'
                    , as: 'store'
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get().collection('product')
        .findOne({_id: new ObjectID(objectId)},{}, function(error, doc){
            cb(error, doc);
        });
}