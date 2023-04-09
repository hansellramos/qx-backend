const db = require('../db');
const ObjectID = require('mongodb').ObjectId;
const sequence_model = require('./internal/sequence');
const common = require('../common');

exports.all = async () => {
    return await db.get()
        .collection('user').aggregate([
            { $match: { deleted: false, id: { $gt: 0 } } }
            , { $lookup: { from: 'profile', localField: 'profile', foreignField: 'id', as: 'profile' } }
            , {
                $project: {
                    id:1, username:1,
                    firstname:1, lastname:1,email:1,
                    allData:1, isAdmin:1,
                    active:1,
                    profile: { _id:1, name:1 }
                }
            }
        ]).toArray();
}

exports.one = async (objectId) => {
    const user = await db.get()
        .collection('user').aggregate([
            { $match: {_id: new ObjectID(objectId)} }
            , { $limit: 1 }
            , { $lookup: { from: 'profile', localField: 'profile', foreignField: 'id', as: 'profile' } }
            , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
            , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
            , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
            , {
                $project: {
                    id:1, username:1,
                    firstname:1, lastname:1,email:1,
                    allData:1, isAdmin:1,
                    active:1,
                    profile: { _id:1, id:1, name:1, permissions:1 }
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
    return user.length > 0 ? user[0] : false;
}

exports.oneById = async (id) => {
    const user = await db.get()
        .collection('user').aggregate([
        { $match: {id: id} }
        , { $limit: 1 }
        , { $lookup: { from: 'profile', localField: 'profile', foreignField: 'id', as: 'profile' } }
        , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
        , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
        , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
        , {
            $project: {
                id:1, username:1,
                firstname:1, lastname:1,email:1,
                allData:1, isAdmin:1,
                active:1,
                profile: { _id:1, id:1, name:1, permissions:1 }
                , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
            }
        }
    ]).toArray();
    return user.length > 0 ? user[0] : false;
}

exports.oneByUsername = async (username) => {
    const user = await db.get()
        .collection('user').aggregate([
        { $match: {username: username} }
        , { $limit: 1 }
        , { $lookup: { from: 'profile', localField: 'profile', foreignField: 'id', as: 'profile' } }
        , { $lookup: { from: 'user', localField: 'creator', foreignField: 'id', as: 'creator'} }
        , { $lookup: { from: 'user', localField: 'modifier', foreignField: 'id', as: 'modifier'} }
        , { $lookup: { from: 'user', localField: 'deleter', foreignField: 'id', as: 'deleter'} }
        , {
            $project: {
                id:1, username:1,
                firstname:1, lastname:1,email:1, passwordLastUpdate:1, password:1,
                allData:1, isAdmin:1,
                active:1,
                profile: { _id:1, id:1, name:1, permissions:1 }
                , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
            }
        }
    ]).toArray();
    return user.length > 0 ? user[0] : false;
}

//verify if exists an object with the same username
exports.exists = async (username) => {
    return await db.get()
        .collection('user')
        .find({
            username: username
            , deleted:false
        })
        .limit(1)
        .toArray();
}

exports.lastInsertedId = async () => {
    const result = await db.get()
        .collection('user')
        .find({},{_id:1})
        .sort({_id:-1})
        .limit(1)
        .toArray();
    return result.length > 0 ? result[0] : false;
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('user');
    if (!counter) {
        return false;
    }

    return await db.get()
        .collection('user').insertOne({
            id: counter.value.seq
            , username: data.username
            , password: common.generatePassword(data.password, common.makeSalt())
            , firstname: data.firstname
            , lastname: data.lastname
            , email: data.email
            , profile: data.profile
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
    if(data.password) {
        data.password = common.generatePassword(data.password, common.makeSalt());
        data.passwordLastUpdate = (new Date()).getTime()
    }
    data.modified = (new Date()).getTime();
    data.modifier = user.id;
    return await db.get()
        .collection('user').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: data }
    );
}

//delete data
exports.delete = async (objectId, user) => {
    return await db.get()
        .collection('user').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
    );
}
