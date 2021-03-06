var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = function (cb) {
    db.get()
        .collection('subsidiary').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , { $lookup: { from: 'user', localField: 'leader', foreignField: 'id', as: 'leader'} }
            , {
                $project: {
                    id:1, name:1, reference:1,
                    //leader: 1,
                    leader: { _id:1, id:1, firstname:1, lastname:1 },
                    active:1,
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('subsidiary').aggregate([
        { $match: {_id: new ObjectID(objectId)} }
        , { $limit: 1 }
        , { $lookup: { from: 'user', localField: 'leader', foreignField: 'id', as: 'leader'} }
        , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
        , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
        , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
        , {
            $project: {
                id:1, name:1, reference:1
                //, leader: 1
                , leader: { _id:1, id:1, firstname:1, lastname:1 }
                , active:1
                , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
            }
        }
    ]).toArray(function (err, docs) {
        //cb(err, docs);
        cb(err, docs.length > 0 ? docs[0] : docs);
    });
}

exports.oneById = function (id, cb) {
    db.get()
        .collection('subsidiary').aggregate([
        { $match: {id: id} }
        , { $limit: 1 }
        , { $limit: 1 }
        //, { $lookup: { from: 'user', localField: 'leader', foreignField: 'id', as: 'leader'} }
        , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
        , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
        , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
        , {
            $project: {
                id:1, name:1, reference:1
                , leader: 1
                //leader: { _id:1, id:1, firstname:1, lastname:1 },
                , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
            }
        }
    ]).toArray(function (err, docs) {
        cb(err, docs.length > 0 ? docs[0] : docs);
    });
}

//verify if exists an object with the same reference and not be deleted
exports.exists = function (reference, cb) {
    db.get()
        .collection('subsidiary').find(
            {reference: reference, deleted:false}
        ).limit(1)
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.lastInsertedId = function(cb){
    db.get()
        .collection('subsidiary')
        .find({},{_id:1})
        .sort({_id:-1})
        .limit(1).toArray(function(error, results){
            if(results.length>0){
                cb(error, results[0]);
            }else{
                cb(error, results);
            }
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
                    , leader: data.leader
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
exports.update = function (objectId, data, user, cb) {
    db.get()
        .collection('subsidiary').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: data }
        , function(error, result){
            cb(error, result);
        }
    );
}

//delete data
exports.delete = function (objectId, user, cb) {
    db.get()
        .collection('subsidiary').findOneAndUpdate(
            { _id: new ObjectID(objectId) },
            { $set: { deleted: (new Date()).getTime(), deleter: user } }
        , function(error, result){
            cb(error, result);
        }
    );
}