var db = require('../db');
var ObjectID = require('mongodb').ObjectID;

exports.all = function (cb) {
    db.get()
        .collection('user').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , { $lookup: { from: 'profile', localField: 'profile', foreignField: 'id', as: 'profile' } }
            , {
                $project: {
                    id:1, username:1,
                    firstname:1, lastname:1,
                    allData:1, isAdmin:1,
                    active:1,
                    profile: { _id:1, name:1 }
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
            , { $limit: 1 }
            , { $lookup: { from: 'profile', localField: 'profile', foreignField: 'id', as: 'profile' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id:1, username:1,
                    firstname:1, lastname:1,
                    allData:1, isAdmin:1,
                    active:1,
                    profile: { _id:1, name:1, permissions:1 }
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
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
            , { $limit: 1 }
            , { $lookup: { from: 'profile', localField: 'profile', foreignField: 'id', as: 'profile' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id:1, username:1,
                    firstname:1, lastname:1,
                    allData:1, isAdmin:1,
                    active:1,
                    profile: { _id:1, name:1, permissions:1 }
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}

//verify if exists an object with the same username
exports.exists = function (username, cb) {
    db.get()
        .collection('user').find(
            {username: username}
        )
        .limit(1)
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}