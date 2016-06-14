var db = require('../db');
var ObjectID = require('mongodb').ObjectID;

exports.all = function (cb) {
    db.get()
        .collection('user').aggregate([
            {
                $match: { deleted: false, id: { $gt: 0 } }
            }
            , {
                $lookup: {
                    from: 'profile'
                    , localField: 'profile'
                    , foreignField: 'id'
                    , as: 'profile'
                }
            }
            , {
                $project: {
                    id:1, username:1,
                    firstname:1, lastname:1,
                    allData:1, isAdmin:1,
                    active:1,
                    profile: {
                        _id:1, name:1
                    }
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('user').aggregate([
        { $match: {_id: new ObjectID(objectId)} }
        , {
            $lookup: {
                from: 'profile'
                , localField: 'profile'
                , foreignField: 'id'
                , as: 'profile'
            }
        }
    ]).toArray(function (err, docs) {
        cb(err, docs.length > 0 ? docs[0] : docs);
    });
}

exports.oneById = function (id, cb) {
    db.get()
        .collection('user').aggregate([
        { $match: {id: id} }
        , {
            $lookup: {
                from: 'profile'
                , localField: 'profile'
                , foreignField: 'id'
                , as: 'profile'
            }
        }
    ]).toArray(function (err, docs) {
        cb(err, docs.length > 0 ? docs[0] : docs);
    });
}