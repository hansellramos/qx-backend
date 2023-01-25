const express = require('express');
const record_model = require('../models/record');
const product_model = require('../models/product');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral, errorMalformedParameters, errorObjectNotFound, errorInvalidParameter, successCreation,
    successGeneral
} = require("../helpers/responsesHelper");

/* GET records listing. */
router.get('/:token/:product', auth, async (req, res) => {
    if (!req.params.product) {
        return errorMalformedParameters(res, config.messages.product.paramProductInvalid);
    }

    const productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.product.paramProductInvalid} ${productParamValidation.message}`);
    }
    const product = await product_model.one(req.params.product);
    if (product == null) {
        return errorGeneral(res);
    }
    if(product === false) {
        return errorMalformedParameters(res, config.messages.product.nonExistentProduct);
    }

    const records = await record_model.all(product);
    if (records == null) {
        return errorGeneral(res);
    }
    return res.json(records);
});

/* Get one record */
router.get('/:token/:product/:record', auth, async (req, res) => {
    const productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.product.paramProductInvalid} ${productParamValidation.message}`);
    }

    const recordParamValidation = common.validateObjectId(req.params.record);
    if(!recordParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.record.paramRecordInvalid} ${recordParamValidation.message}`);
    }

    const record = await record_model.one(req.params.record);
    if (record === false) {
        return errorGeneral(res);
    }

    if(record.length === 0){
        return errorObjectNotFound(res, config.messages.record.nonExistentRecord);
    }
    return res.json(record);
});

/* POST record creation. */
router.post('/:token/:product', auth, async (req, res) => {
    const existentRecord = await record_model.exists(data.reference, data.product);
    if (existentRecord === null) {
        return errorGeneral(res);
    }
    if (existentRecord.length > 0) {
        return errorInvalidParameter(res, config.messages.record.notSaved, {
            fields: {
                reference: {
                    error: true,
                    message: config.messages.record.referenceExists,
                    value: data.reference
                }
            }
        });
    }

    data.properties = completeProperties(data.properties, req.user.id);
    const result = await record_model.add(data, req.user.id);
    if (!result) {
        return errorGeneral(res);
    }
    const lastInsertedId = await record_model.lastInsertedId();
    await log.save(req.user.id, 'record','add', lastInsertedId._id, data,[]);
    return successCreation(res, config.messages.record.addedSuccessfully, lastInsertedId);
});

/* POST record update. */
router.put('/:token/:record', auth, async (req, res) => {
    const recordParamValidation = common.validateObjectId(req.params.record);
    if(!recordParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.record.paramRecordInvalid} ${recordParamValidation.message}`);
    }

    const existentRecord = await record_model.one(req.params.record);
    if (existentRecord === null) {
        return errorGeneral(res);
    }
    if (existentRecord === false) {
        return errorObjectNotFound(res, config.messages.record.nonExistentRecord);
    }

    if(!data.reference){
        data.reference = existentRecord.reference;
    } else {
        // TODO: validate if reference is unique for the product
        // const existentRecordWithReference = await record_model.exists(data.reference, existentRecord.product);
        // if (
        //     (data.reference != existentRecordWithReference[0].reference && existentRecordWithReference.length > 0) //if reference was changed
        //     || (data.reference == existentRecordWithReference[0].reference && existentRecordWithReference.length > 1) //if reference has no changed
        // ){
        //     return errorInvalidParameter(res, config.messages.record.notSaved, {
        //         fields: {
        //             reference: {
        //                 error: true,
        //                 message: config.messages.record.referenceExists,
        //                 value: data.reference
        //             }
        //         }
        //     });
        // }
    }
    data.reference = data.reference.trim();
    const result = await record_model.update(req.params.record, data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'record', 'update', req.params.record, data, existentRecord);
    return successGeneral(res, config.messages.record.updatedSuccessfully);
});

/* DELETE record elimination. */
router.delete('/:token/:record', auth, async (req, res) => {
    const recordParamValidation = common.validateObjectId(req.params.record);
    if(!recordParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.record.paramRecordInvalid} ${recordParamValidation.message}`);
    }
    const doc = await record_model.one(req.params.record);
    if (doc === null) {
        return errorGeneral(res);
    }
    if (doc === false) {
        return errorObjectNotFound(res, config.messages.record.nonExistentRecord);
    }
    const result = await record_model.delete(req.params.record, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'record', 'delete', req.params.record, [], doc);
    return successGeneral(res, config.messages.record.deletedSuccessfully);
});

const completeProperties = (properties, user) => {
    const _properties = [];
    const _date = new Date();
    for (let i in properties){
        _properties.push({
            property:properties[i].property
            , value:properties[i].value
            , creator: user
            , creation: _date.getTime()
            , modifier: user
            , modified: _date.getTime()
            , deleter: false
            , deleted: false
        });
    }
    return _properties;
}

module.exports = router;
