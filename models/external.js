var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = function (cb) {
    db.get()
        .collection('external').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , {
                $project: {
                    id:1, name:1,
                    address:1, phone:1,
                    notes:1, contact:1,
                    active:1,
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('external').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id:1, name:1,
                    address:1, phone:1,
                    notes:1, contact:1,
                    active:1
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
        .collection('external').aggregate([
            { $match: {id: id} }
            , { $limit: 1 }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id:1, name:1,
                    address:1, phone:1,
                    notes:1, contact:1,
                    active:1
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
exports.exists = function (name, cb) {
    db.get()
        .collection('external').find(
        {name: name, deleted:false}
        )
        .limit(1)
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.lastInsertedId = function(cb){
    db.get()
        .collection('external')
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
    sequence_model.getSequence('external', function(error, counter){
        if(error){
            cb(error);
        }else{
            db.get()
                .collection('external').insertOne({
                    id: counter.value.seq
                    , name: data.name
                    , address: data.address
                    , phone: data.phone
                    , contact: data.contact
                    , notes: data.notes
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
        .collection('external').findOneAndUpdate(
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
        .collection('external').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
        , function(error, result){
            cb(error, result);
        }
    );
}