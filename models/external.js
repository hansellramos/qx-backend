const db = require('../db');
const ObjectID = require('mongodb').ObjectID;
const sequence_model = require('./internal/sequence');

exports.all = async () => {
    return await db.get()
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
        ]).toArray();
}

exports.one = async (objectId) => {
    const external = await db.get()
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
        ]).toArray();
    return external.length > 0 ? external[0] : false;
}

exports.oneById = async (id) => {
    return await db.get()
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
        ]).toArray();
}

//verify if exists an object with the same reference
exports.exists = async (name) =>{
    return await db.get()
        .collection('external')
        .find({
            name: name
            , deleted:false
        })
        .limit(1)
        .toArray();
}

exports.lastInsertedId = async () => {
    const result = await db.get()
        .collection('external')
        .find({},{_id:1})
        .sort({_id:-1})
        .limit(1)
        .toArray();
    return result.length > 0 ? result[0] : false;
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('external');
    if (!counter) {
        return false;
    }
    return await db.get()
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
        });
}

// Update existent data
exports.update = async (objectId, data, user) => {
    data.modified = (new Date()).getTime();
    data.modifier = user;
    return await db.get()
        .collection('external').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: data }
    );
}

//delete data
exports.delete = async (objectId, user) => {
    return await db.get()
        .collection('external').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
    );
}
