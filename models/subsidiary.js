var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = function (cb) {
    db.get()
        .collection('subsidiary').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , {
                $project: {
                    id:1, name:1, reference:1,
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
        , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
        , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
        , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
        , {
            $project: {
                id:1, name:1, reference:1
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
        .collection('subsidiary').aggregate([
        { $match: {id: id} }
        , { $limit: 1 }
        , { $limit: 1 }
        , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
        , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
        , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
        , {
            $project: {
                id:1, name:1, reference:1
                , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
            }
        }
    ]).toArray(function (err, docs) {
        cb(err, docs.length > 0 ? docs[0] : docs);
    });
}

//verify if exists an object with the same reference
exports.exists = function (reference, cb) {
    db.get()
        .collection('subsidiary').find(
            {reference: reference}
        ).limit(1)
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