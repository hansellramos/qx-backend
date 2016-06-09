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
                    , quantity: 1
                    , presentation: 1
                    , remission: 1
                    , product: {
                        _id: 1
                        , name: 1
                        , reference: 1
                    }
                    , customer: {
                        _id: 1, name: 1
                    }
                    , creator: {
                        _id: 1, firstname: 1, lastname: 1
                    }, created: 1
                }
            }
            , { $sort: {_id:-1} }
            , { $limit : 50 }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
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
                $lookup: {
                    from: 'user'
                    , localField: 'modifier'
                    , foreignField: 'id'
                    , as: 'modifier'
                }
            }
            , {
                $lookup: {
                    from: 'user'
                    , localField: 'deleter'
                    , foreignField: 'id'
                    , as: 'deleter'
                }
            }
        , {
            $project: {
                id: 1,
                quantity: 1,
                presentation: 1,
                remission: 1,
                date: 1,
                active: 1,
                clause: 1,
                product: {
                    _id: 1, id: 1, name: 1, reference: 1
                },
                customer: {
                    _id: 1, id: 1, name: 1
                },
                properties: 1,
                values: 1,
                creator: {
                    _id:1, id:1, username:1, firstname:1, lastname:1
                },
                created: 1,
                modifier: {
                    _id:1, id:1, username:1, firstname:1, lastname:1
                },
                modified: 1,
                deleter: 1,
                deleted: 1,
            }
          }
        ])
        .toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}