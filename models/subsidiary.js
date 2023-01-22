const db = require('../db');
const ObjectID = require('mongodb').ObjectID;
const sequence_model = require('./internal/sequence');

exports.all = async () => {
    return await db.get()
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
        ]).toArray();
}

exports.one = async (objectId) => {
    const doc = await db.get()
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
    ]).toArray();
    return doc.length ? doc[0] : false;
}

exports.oneById = async (id) => {
    const doc = await db.get()
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
    ]).toArray();
    return doc.length ? doc[0] : false;
}

//verify if exists an object with the same reference and not be deleted
exports.exists = async (reference) => {
    return await db.get()
        .collection('subsidiary').find(
            {reference: reference, deleted:false}
        ).limit(1)
        .toArray();
}

exports.lastInsertedId = async() => {
    return await db.get()
        .collection('subsidiary')
        .find({},{_id:1})
        .sort({_id:-1})
        .limit(1).toArray();
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('subsidiary');
    if (!counter) {
        return false;
    }

    return await db.get()
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
    });
}

// Update existent data
exports.update = async (objectId, data, user) => {
    data.modified = (new Date()).getTime();
    data.modifier = user;
    return await db.get()
        .collection('subsidiary')
        .findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: data });
}

//delete data
exports.delete = async (objectId, user) => {
    return await db.get()
        .collection('subsidiary')
        .findOneAndUpdate(
            { _id: new ObjectID(objectId) },
            { $set: { deleted: (new Date()).getTime(), deleter: user } }
        );
}
