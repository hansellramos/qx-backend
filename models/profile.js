var db = require('../db');
var ObjectID = require('mongodb').ObjectID;

exports.all = function (cb) {
    db.get()
        .collection('profile').aggregate([
            {
                $match: { deleted: false, id: { $gt: 0 } }
            }
            , {
                $project: {
                    id:1, name:1,
                    active:1
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
                from: 'user'
                , localField: 'creator'
                , foreignField: 'id'
                , as: 'creator'
            }
        }
    ]).toArray(function (err, docs) {
        cb(err, docs.length > 0 ? docs[0] : docs);
    });
}