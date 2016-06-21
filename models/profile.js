var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = function (cb) {
    db.get()
        .collection('profile').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , {
                $project: {
                    id:1, name:1, description:1,
                    active:1
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('profile').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            ,{
                $project: {
                    id:1, name:1, description:1, active: 1
                    , permissions:1
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
        .collection('profile').aggregate([
            { $match: {id: id} }
            , { $limit: 1 }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            ,{
                $project: {
                    id:1, name:1, description:1, active: 1
                    , permissions:1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}

// Insert new data
exports.add = function (data, user, cb) {
    sequence_model.getSequence('profile', function(error, counter){
        if(error){
            cb(error);
        }else{
            db.get()
                .collection('profile').insertOne({
                    id: counter.value.seq
                    , name: data.name
                    , description: data.description
                    , permissions: this.formatPermissions(data)
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

exports.formatPermissions = function(profile){
    var permissions = [];
    var _t = new Date();
    for(var i=0;i<profile.permissions;i++){
        permissions.push({
            permission: profile.permissions[i], date: _t.getTime()
        });
    }
    return permissions;
}

//delete data
exports.delete = function (objectId, user, cb) {
    db.get()
        .collection('profile').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
        , function(error, result){
            cb(error, result);
        }
    );
}