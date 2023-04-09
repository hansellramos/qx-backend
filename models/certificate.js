const db = require('../db');
const ObjectID = require('mongodb').ObjectId;
const sequence_model = require('./internal/sequence');
const crypto = require('crypto');
const config = require('../config');

exports.all = async (from) => {
    return await db.get()
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
                    , max_dose: 1, due_date:1, due_label:1, elaboration_date:1
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
        ]).toArray();
}

exports.one = async (objectId) => {
    const certificate = await db.get()
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
                    active: 1, verification: 1, certification_nsf:1, max_dose: 1, due_date:1, due_label:1, elaboration_date:1
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
        ]).toArray();
    return certificate.length > 0 ? certificate[0] : false;
}

exports.oneById = async (id) => {
    return await db.get()
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
                    active: 1, verification: 1, max_dose: 1, due_date:1, due_label:1, elaboration_date:1
                    , leader:1, clause: 1,
                    product: { _id: 1, id: 1, name: 1, reference: 1 },
                    customer: { _id: 1, id: 1, name: 1 },
                    properties: 1, values: 1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
}

exports.validate = async (id, verification) => {
    const certificate = await db.get()
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
                active: 1, verification: 1, max_dose: 1, due_date:1, due_label:1, elaboration_date:1
                , leader:1, clause: 1,
                product: { _id: 1, id: 1, name: 1, reference: 1 },
                customer: { _id: 1, id: 1, name: 1 },
                properties: 1, values: 1
                , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
            }
        }
    ]).toArray();
    return certificate.length > 0 ? certificate[0] : false;
}

exports.lastInsertedId = async () => {
    const result = await db.get()
        .collection('certificate')
        .find({},{_id:1, id:1})
        .sort({_id:-1})
        .limit(1)
        .toArray();
    return result.length > 0 ? result[0] : false;
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('certificate');
    if (!counter) {
        return false;
    }

    const _certificate = {
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
        , due_label: data.due_label
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

    return await db.get()
        .collection('certificate').insertOne(_certificate);
}

//delete data
exports.delete = async (objectId, user) => {
    return await db.get()
        .collection('certificate').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
        );
}
