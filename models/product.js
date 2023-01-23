var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = async () => {
    return await db.get()
        .collection('product').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , { $lookup: { from: 'store', localField: 'store', foreignField: 'id', as: 'store' } }
            , {
                $project: {
                    _id: 1, id:1
                    , name: 1, reference: 1
                    , max_dose:1, due_date:1, due_label:1, certification_nsf:1
                    , active: 1
                    , store: { _id: 1, name: 1, reference: 1 }
                    , properties: { name: 1, id: 1 }
                }
            }
        ])
        .toArray();
}

exports.one = async (objectId) => {
    const record = await db.get()
        .collection('product').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'store', localField: 'store', foreignField: 'id', as: 'store' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    _id: 1, id:1
                    , name: 1, reference: 1, notes:1
                    , max_dose:1, due_date:1, due_label:1, certification_nsf:1
                    , active: 1
                    , store: { _id: 1, id:1, name: 1, reference: 1, subsidiary:1 }
                    , properties: { name: 1, id: 1, validation:1, active:1, deleted:1 }
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
    return record.length > 0 ? record[0] : false;
}

exports.oneById = async (id) => {
    return await db.get()
        .collection('product').aggregate([
            { $match: {id: id} }
            , { $limit: 1 }
            , { $lookup: { from: 'store', localField: 'store', foreignField: 'id', as: 'store' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    _id: 1, id:1
                    , name: 1, reference: 1, notes:1
                    , max_dose:1, due_date:1, due_label:1, certification_nsf:1
                    , active: 1
                    , store: { _id: 1, id:1, name: 1, reference: 1, subsidiary:1 }
                    , properties: { name: 1, id: 1, validation:1, active:1 }
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
}

//verify if exists an object with the same reference
exports.exists = async (reference) => {
    return await db.get()
        .collection('product')
        .find({
            reference: reference
            , deleted:false
        })
        .limit(1)
        .toArray();
}

exports.lastInsertedId = async () => {
    return await db.get()
        .collection('product')
        .findOne({},{_id:1})
        .sort({_id:-1})
        .limit(1);
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('product');
    if (!counter) {
        return false;
    }
    return await db.get()
        .collection('product').insertOne({
            id: counter.value.seq
            , store: data.store
            , name: data.name
            , reference: data.reference
            , max_dose: data.max_dose
            , due_date: data.due_date
            , due_label: data.due_label
            , certification_nsf: data.certification_nsf
            , properties: data.properties
            , active: data.active
            , creator: user
            , created: (new Date()).getTime()
            , modifier: user
            , modified: (new Date()).getTime()
            , deleter: false
            , deleted: false
        });
}

// Update existent data
exports.update = async (objectId, data, user) => {
    data.modified = (new Date()).getTime();
    data.modifier = user;
    return await db.get()
        .collection('product').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: data }
    );
}

//delete data
exports.delete = async (objectId, user) => {
    return await db.get()
        .collection('product').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
    );
}
