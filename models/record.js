var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var sequence_model = require('./internal/sequence');

exports.all = async (product) => {
    return await db.get()
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
                    , satisfies: 1, veredict: 1, notes:1
                    , active: 1
                }
            }
        ])
        .toArray();
}

exports.one = async (objectId) => {
    const record = await db.get()
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
                    id:1, reference:1
                    , supplier:1, product:1, properties:1
                    , analysis_date: 1, elaboration_date: 1, due_date: 1, reception_date: 1
                    , remission: 1, certificates: 1
                    , clause: 1
                    , quantity: 1,existing_quantity: 1
                    , satisfies: 1, veredict: 1, notes:1
                    , active: 1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
    return record.length > 0 ? record[0] : false;
}

exports.oneByReference = async (reference) => {
    return await db.get()
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
                    id:1, reference:1
                    , supplier:1, product:1, properties:1
                    , analysis_date: 1, elaboration_date: 1, due_date: 1, reception_date: 1
                    , remission: 1, certificates: 1
                    , clause: 1
                    , quantity: 1,existing_quantity: 1
                    , satisfies: 1, veredict: 1
                    , active: 1
                    , creator: { _id:1, id:1, firstname:1, lastname:1 }, created:1
                    , modifier: { _id:1, id:1, firstname:1, lastname:1 }, modified:1
                    , deleter: { _id:1, id:1, firstname:1, lastname:1 }, deleted:1
                }
            }
        ]).toArray();
}

//verify if exists an object with the same reference
exports.exists = async (reference, product) => {
    return await db.get()
        .collection('record')
        .find({
            reference: reference
            , deleted:false
            , product:product
        }).limit(2)
        .toArray();
}

exports.lastInsertedId = async() => {
    return await db.get()
        .collection('record')
        .findOne({},{_id:1})
        .sort({_id:-1})
        .limit(1);
}

// Insert new data
exports.add = async (data, user) => {
    const counter = await sequence_model.getSequence('record');
    if (!counter) {
        return false;
    }
    return await db.get()
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
            });
}

// Update existent data
exports.update = async (objectId, data, user) => {
    data.modified = (new Date()).getTime();
    data.modifier = user;
    return await db.get()
        .collection('record').findOneAndUpdate(
        { _id: new ObjectID(objectId) }
        , { $set: data });
}

exports.parsePropertiesChanges = (newData, oldData, user) => {
    if(newData.properties){
        for(let p = 0; p < newData.properties.length; p++){
            const property = newData.properties[p];
            for(let rp = 0; rp < oldData.properties.length; rp++){
                const recordProperty = oldData.properties[rp];
                if(property.property === recordProperty.property) {
                    recordProperty.value = property.value;
                    recordProperty.modified = new Date().getTime();
                    recordProperty.modifier = user;
                }
            }
        }
        newData.properties = oldData.properties;
    }
    return newData;
}

//delete data
exports.delete = async (objectId, user) => {
    return await db.get()
        .collection('record').findOneAndUpdate(
        { _id: new ObjectID(objectId) },
        { $set: { deleted: (new Date()).getTime(), deleter: user } }
    );
}
