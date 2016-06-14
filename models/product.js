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
            , {
                $project: {
                    _id: 1
                    , name: 1
                    , reference: 1
                    , active: 1
                    , store: {
                        _id: 1
                        , name: 1
                        , reference: 1
                    }
                    , properties: {
                        name: 1
                        , id: 1
                    }

                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get().collection('product')
        .findOne({_id: new ObjectID(objectId)}, {}, function (error, doc) {
            cb(error, doc);
        });
}