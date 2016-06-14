var db = require('../db');
var ObjectID = require('mongodb').ObjectID;

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('product').aggregate([
            { $lookup: { from: 'store', localField: 'store', foreignField: 'id', as: 'store' } }
            , {
                $project: {
                    _id: 1
                    , name: 1, reference: 1
                    , active: 1
                    , store: { _id: 1, name: 1, reference: 1 }
                    , properties: { name: 1, id: 1 }
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('product').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'store', localField: 'store', foreignField: 'id', as: 'store' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    _id: 1
                    , name: 1, reference: 1, notes:1
                    , active: 1
                    , store: { _id: 1, name: 1, reference: 1 }
                    , properties: { name: 1, id: 1, validations:1, active:1 }
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
        .collection('product').aggregate([
            { $match: {id: id} }
            , { $limit: 1 }
            , { $lookup: { from: 'store', localField: 'store', foreignField: 'id', as: 'store' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    _id: 1
                    , name: 1, reference: 1, notes:1
                    , active: 1
                    , store: { _id: 1, name: 1, reference: 1 }
                    , properties: { name: 1, id: 1, validations:1, active:1 }
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}