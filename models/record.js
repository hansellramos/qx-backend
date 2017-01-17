var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = function (product, cb) {
    db.get()
        .collection('record').aggregate([
            { $match: { product: product.id, deleted: false, id: { $gt: 0 } } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator' } }
            , { $lookup: { from: 'external', localField: 'supplier', foreignField: 'id', as: 'supplier'} }
            , {
                $project: {
                    _id: 1
                    , reference: 1
                    , product: 1, supplier: { name: 1 }
                    , properties: 1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }
                    , analysis_date: 1, elaboration_date: 1, due_date: 1, reception_date: 1
                    , remission: 1
                    , quantity: 1,existing_quantity: 1
                    , satisfies: 1, veredict: 1
                    , active: 1
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.one = function (objectId, cb) {
    db.get()
        .collection('record').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'external', localField: 'supplier', foreignField: 'id', as: 'supplier'} }
            , { $lookup: { from: 'product', localField: 'product', foreignField: 'id', as: 'product'} }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            ,{
                $project: {
                    id:1, reference:1, active: 1
                    , supplier:1, product:1, properties:1
                    , analysis_date: 1, elaboration_date: 1, due_date: 1, reception_date: 1
                    , remission: 1
                    , clause: 1
                    , quantity: 1,existing_quantity: 1
                    , satisfies: 1, veredict: 1
                    , active: 1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray(function (err, docs) {
            cb(err, docs.length > 0 ? docs[0] : docs);
        });
}

exports.oneByReference = function (reference, cb) {
    db.get()
        .collection('record').aggregate([
            { $match: { reference: reference} }
            , { $limit: 1 }
            , { $lookup: { from: 'external', localField: 'supplier', foreignField: 'id', as: 'supplier'} }
            , { $lookup: { from: 'product', localField: 'product', foreignField: 'id', as: 'product'} }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            ,{
                $project: {
                    id:1, reference:1, active: 1
                    , supplier:1, product:1, properties:1
                    , analysis_date: 1, elaboration_date: 1, due_date: 1, reception_date: 1
                    , remission: 1
                    , clause: 1
                    , quantity: 1,existing_quantity: 1
                    , satisfies: 1, veredict: 1
                    , active: 1
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
exports.exists = function (reference, product, cb) {
    db.get()
        .collection('record').find(
            { reference: reference, deleted:false, product:product }
        ).limit(1)
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

exports.lastInsertedId = function(cb){
    db.get()
        .collection('record')
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
    sequence_model.getSequence('record', function(error, counter){
        if(error){
            cb(error);
        }else{
            db.get()
                .collection('record').insertOne({
                    id: counter.value.seq
                    , product: data.product
                    , reference: data.reference
                    , analysis_date: data.analysis_date
                    , elaboration_date: data.elaboration_date
                    , due_date: data.due_date
                    , reception_date: data.reception_date
                    , properties: data.properties
                    , veredict: data.veredict
                    , remission: data.remission
                    , quantity: data.quantity
                    , existing_quantity: data.existing_quantity
                    , supplier: data.supplier
                    , satisfies: data.satisfies
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
        .collection('record').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
        , function(error, result){
            cb(error, result);
        }
    );
}