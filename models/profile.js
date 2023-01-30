var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = async () => {
    return await db.get()
        .collection('profile').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , {
                $project: {
                    id:1, name:1, description:1,
                    active:1
                }
            }
        ]).toArray();
}

exports.one = async (objectId) => {
    const profile = await db.get()
        .collection('profile').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            ,{
                $project: {
                    id:1, name:1, description:1, active: 1
                    , permissions:1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
    return profile.length > 0 ? profile[0] : false;
}

exports.oneById = async (id, ) => {
    return await db.get()
        .collection('profile').aggregate([
            { $match: {id: id} }
            , { $limit: 1 }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            ,{
                $project: {
                    id:1, name:1, description:1, active: 1
                    , permissions:1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('profile');
    if (!counter) {
        return false;
    }
    return await db.get()
        .collection('profile').insertOne({
                id: counter.value.seq
                , name: data.name
                , description: data.description
                , permissions: this.formatPermissions(data)
                , active: data.active
                , creator: user
                , created: (new Date()).getTime()
                , modifier: user
                , modified: (new Date()).getTime()
                , deleter: false
                , deleted: false
            });
}

exports.lastInsertedId = async () => {
    const result = await db.get()
        .collection('profile')
        .find({},{_id:1})
        .sort({_id:-1})
        .limit(1);
    return result.length > 0 ? result[0] : false;
}

exports.formatPermissions = (profile) => {
    const permissions = [];
    const _t = new Date();
    for(let i=0;i<profile.permissions;i++){
        permissions.push({
            permission: profile.permissions[i], date: _t.getTime()
        });
    }
    return permissions;
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('profile');
    if (!counter) {
        return false;
    }
    return await db.get()
        .collection('profile').insertOne({
                id: counter.value.seq
                , name: data.name
                , description: data.reference
                , permissions: data.permissions
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
    data.modifier = user;
    data.modified = (new Date()).getTime();
    return await db.get()
        .collection('profile').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: data }
    );
}

//delete data
exports.delete = async (objectId, user) => {
    return await db.get()
        .collection('profile').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
    );
}
