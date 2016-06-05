var db = require('../db');
var ObjectID = require('mongodb').ObjectID;

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('certificate').aggregate([
            {
                $lookup: {
                    from: 'product'
                    , localField: 'product'
                    , foreignField: 'id'
                    , as: 'product'
                }
            }
            , {
                $lookup: {
                    from: 'external'
                    , localField: 'customer'
                    , foreignField: 'id'
                    , as: 'customer'
                }
            }
            , {
                $lookup: {
                    from: 'user'
                    , localField: 'creator'
                    , foreignField: 'id'
                    , as: 'creator'
                }
            }
            , {
                $project: {
                    _id: 1
                    , id: 1
                    , created: 1
                    , quantity: 1
                    , presentation: 1
                    , remission: 1
                    , product: {
                        _id: 1
                        , name: 1
                        , reference: 1
                    }
                    , customer: {
                        _id: 1
                        , name: 1
                    }
                    , creator: {
                        _id: 1
                        , firstname: 1
                        , lastname: 1
                    }

                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get().collection('certificate')
        .findOne({_id: new ObjectID(objectId)}, {}, function (error, doc) {
            cb(error, doc);
        });
}