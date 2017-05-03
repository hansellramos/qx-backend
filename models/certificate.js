var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');
var crypto = require('crypto');
var config = require('../config');

exports.all = function (from, cb) {
    var items = [];
    db.get()
        .collection('certificate').aggregate([
            { $match: {deleted: false, id: { $gt: 0 }, created: { $gt: from} } }
            , { $lookup: { from: 'product' , localField: 'product' , foreignField: 'id' , as: 'product' } }
            , { $lookup: { from: 'external' , localField: 'customer' , foreignField: 'id' , as: 'customer' } }
            , { $lookup: { from: 'user' , localField: 'creator' , foreignField: 'id' , as: 'creator' } }
            , {
                $project: {
                    _id: 1
                    , id: 1
                    , quantity: 1
                    , presentation: 1
                    , max_dose: 1, due_date:1, elaboration_date:1
                    , verification: 1
                    , leader:1, active: 1
                    , remission: 1
                    , product: { _id: 1, name: 1, reference: 1 }
                    , customer: { _id: 1, name: 1 }
                    , creator: { _id: 1, firstname: 1, lastname: 1 }, created: 1
                }
            }
            , { $sort: {_id:-1} }
            /*, { $limit : 50 }*/
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('certificate').aggregate([
            { $match: { _id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'subsidiary' , localField: 'subsidiary' , foreignField: 'id' , as: 'subsidiary' } }
            , { $lookup: { from: 'product' , localField: 'product' , foreignField: 'id' , as: 'product' } }
            , { $lookup: { from: 'external' , localField: 'customer' , foreignField: 'id' , as: 'customer' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id: 1,remission: 1,
                    quantity: 1,presentation: 1,date: 1,
                    active: 1, verification: 1, certification_nsf:1, max_dose: 1, due_date:1, elaboration_date:1
                    , leader:1, clause: 1,
                    subsidiary: { _id: 1, id: 1, name: 1, reference: 1, leader: 1
                    },
                    product: { _id: 1, id: 1, name: 1, reference: 1 },
                    customer: { _id: 1, id: 1, name: 1 },
                    properties: 1, values: 1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
          }
        ])
        .toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}

exports.oneById = function (id, cb) {
    db.get()
        .collection('certificate').aggregate([
            { $match: { _id:id} }
            , { $limit: 1 }
            , { $lookup: { from: 'product' , localField: 'product' , foreignField: 'id' , as: 'product' } }
            , { $lookup: { from: 'external' , localField: 'customer' , foreignField: 'id' , as: 'customer' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id: 1,remission: 1,
                    quantity: 1,presentation: 1,date: 1,
                    active: 1, verification: 1, max_dose: 1, due_date:1, elaboration_date:1
                    , leader:1, clause: 1,
                    product: { _id: 1, id: 1, name: 1, reference: 1 },
                    customer: { _id: 1, id: 1, name: 1 },
                    properties: 1, values: 1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}

exports.validate = function (id, verification, cb) {
    console.log([id, verification]);
    db.get()
        .collection('certificate').aggregate([
        { $match: { id: parseInt(id), verification: verification } }
        , { $limit: 1 }
        , { $lookup: { from: 'product' , localField: 'product' , foreignField: 'id' , as: 'product' } }
        , { $lookup: { from: 'external' , localField: 'customer' , foreignField: 'id' , as: 'customer' } }
        , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
        , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
        , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
        , {
            $project: {
                id: 1,remission: 1,
                quantity: 1,presentation: 1,date: 1,
                active: 1, verification: 1, max_dose: 1, due_date:1, elaboration_date:1
                , leader:1, clause: 1,
                product: { _id: 1, id: 1, name: 1, reference: 1 },
                customer: { _id: 1, id: 1, name: 1 },
                properties: 1, values: 1
                , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
            }
        }
    ])
        .toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}

exports.lastInsertedId = function(cb){
    db.get()
        .collection('certificate')
        .find({},{_id:1, id:1})
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
    sequence_model.getSequence('certificate', function(error, counter){
        if(error){
            cb(error);
        }else{
            var _certificate = {
                id: counter.value.seq
                , date: data.date
                , subsidiary: data.subsidiary
                , product: data.product
                , customer: data.customer
                , remission: data.remission
                , quantity: data.quantity
                , presentation: data.presentation
                , properties: data.properties
                , values: data.values
                , elaboration_date: data.elaboration_date
                , leader: data.leader
                , clause: data.clause
                , due_date: data.due_date
                , max_dose: data.max_dose
                , certification_nsf: data.certification_nsf
                , active: data.active
                , creator: user
                , created: (new Date()).getTime()
                , modifier: user
                , modified: (new Date()).getTime()
                , deleter: false
                , deleted: false
            };
            _certificate.verification = crypto.createHmac('sha256', config.secret).update(JSON.stringify(_certificate)).digest('hex').substring(29,35)
            db.get()
                .collection('certificate').insertOne(_certificate
                , function (error, result) {
                    cb(error, result);
                });
        }
    });
}

//delete data
exports.delete = function (objectId, user, cb) {
    db.get()
        .collection('certificate').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
        , function(error, result){
            cb(error, result);
        }
    );
}