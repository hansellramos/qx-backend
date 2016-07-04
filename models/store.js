var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('store').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , { $lookup: { from: 'subsidiary', localField: 'subsidiary', foreignField: 'id', as: 'subsidiary'} }
            , {
                $project: {
                    id:1, name:1, reference:1, active:1,
                    address:1, phone:1, notes:1,
                    subsidiary:{
                        _id:1, id:1, name:1, reference:1
                    }
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('store').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'subsidiary', localField: 'subsidiary', foreignField: 'id', as: 'subsidiary'} }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id:1, name:1, reference:1, active:1
                    , address:1, phone:1, notes:1
                    , subsidiary:{ _id:1, id:1, name:1, reference:1 }
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
        .collection('store').aggregate([
            { $match: {id: id} }
            , { $limit: 1 }
            , { $limit: 1 }
            , { $lookup: { from: 'subsidiary', localField: 'subsidiary', foreignField: 'id', as: 'subsidiary'} }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id:1, name:1, reference:1, active:1
                    , address:1, phone:1, notes:1
                    , subsidiary:{ _id:1, id:1, name:1, reference:1 }
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
        .collection('store').find(
            {reference: reference, deleted:false}
        )
        .limit(1)
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

// Insert new data
exports.add = function (data, user, cb) {
    sequence_model.getSequence('store', function(error, counter){
        if(error){
            cb(error);
        }else{
            db.get()
                .collection('store').insertOne({
                    id: counter.value.seq
                    , subsidiary: data.subsidiary
                    , name: data.name
                    , reference: data.reference
                    , address: data.address
                    , phone: data.phone
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

//delete data
exports.delete = function (objectId, user, cb) {
    db.get()
        .collection('store').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
        , function(error, result){
            cb(error, result);
        }
    );
}