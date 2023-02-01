const express = require('express');
const product_model = require('../models/product');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const crypto = require('crypto');
const router = express.Router();
const sha1 = require('sha1');
const auth = require('../middleware/auth');
const { errorMalformedParameters, errorGeneral, errorObjectNotFound, successGeneral, errorInvalidParameter,
    successCreation
} = require('../helpers/responsesHelper');

/* GET product listing. */
router.get('/:token', auth, async (req, res) => {
    const products = await product_model.all();
    if (products == null) {
        return errorGeneral(res);
    }
    return res.json(products);
});

/* GET one product. */
router.get('/:token/:product', auth, async (req, res) => {
    const productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.product.paramProductInvalid} ${productParamValidation.message}`);
    }
    const product = await product_model.one(req.params.product);
    if (product === null) {
        return errorGeneral(res);
    }

    if (product === false) {
        return errorObjectNotFound(res, config.messages.product.nonExistentProduct);
    }
    return res.json(product);
});

/* POST product creation. */
router.post('/:token/', auth, async (req, res) => {
    const data = req.body;
    data.properties = completeProperties(data.properties, req.user.id);
    const existentProduct = await product_model.exists(data.reference);
    if (existentProduct === null) {
        return errorGeneral(res);
    }
    if (existentProduct.length > 0) {
        return errorInvalidParameter(res, config.messages.product.notSaved, {
            fields: {
                reference: {
                    error: true,
                    message: config.messages.product.referenceExists,
                    value: data.reference
                }
            }
        });
    }

    const product = await product_model.add(data, req.user.id);
    if (!product) {
        return errorGeneral(res);
    }
    const lastInsertedId = await product_model.lastInsertedId();
    await log.save(req.user.id, 'product','add', lastInsertedId._id, data,[]);
    return successCreation(res, config.messages.product.addedSuccessfully, lastInsertedId);
});

/* PUT product update. */
router.put('/:token/:product', auth, async (req, res) => {
    const productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.product.paramProductInvalid} ${productParamValidation.message}`);
    }

    const existentProduct = await product_model.one(req.params.product);
    if (existentProduct === null) {
        return errorGeneral(res);
    }
    if (existentProduct === false) {
        return errorObjectNotFound(res, config.messages.product.nonExistentProduct);
    }

    const data = req.body;
    if (data.properties) {
        data.properties = parseProductProperties(data.modifier, data.modified, docs.properties, data.properties);
    }
    const result = await product_model.update(req.params.product, data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'product','update', req.params.product, data, existentProduct);
    return successGeneral(res, config.messages.product.updatedSuccessfully);
});

const parseProductProperties = (modifier, modified, oldProperties, newProperties) => {
    const properties = [];
    for(let n in newProperties){
        const newProperty = newProperties[n];
        const p = {
            id: newProperty.id ? newProperty.id : ''
            , name: newProperty.name
            , validation: newProperty.validation
            , active: newProperty.active
        };

        if(newProperty.remission_editable){
            p.remission_editable = newProperty.remission_editable;
        }

        if(newProperty.status === 'added' || p.id === ''){
            p.id = sha1(JSON.stringify(p));
            p.created = modified;
            p.creator = modifier;
            newProperty.status = 'updated';
        }else{
            p.created = modified;
            p.created = modifier;
        }

        if(newProperty.status === 'updated'){
            p.modified = modified;
            p.modifier = modifier;
        }

        if(newProperty.deleted === true){
            p.deleted = modified;
            p.deleter = modifier;
        }else{
            p.deleted = p.deleter = false;
        }

        properties.push(p);
    }
    return properties;
}

/* DELETE product elimination. */
router.delete('/:token/:product', auth, async (req, res) => {
    const productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.product.paramProductInvalid} ${productParamValidation.message}`);
    }
    const doc = await product_model.one(req.params.product);
    if (doc === null) {
        return errorGeneral(res);
    }
    if (doc === false) {
        return errorObjectNotFound(res, config.messages.product.nonExistentProduct);
    }

    const result = await product_model.delete(req.params.product, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'product', 'delete', req.params.product, {}, doc);
    return successGeneral(res, config.messages.product.deletedSuccessfully);
});

const completeProperties = (properties, user) => {
    const _properties = [];
    const _date = new Date();
    for (let i in properties){
        const _p = {
            id:''
            , name: properties[i].name
            , validation: properties[i].validation
            , remission_editable: properties[i].remission_editable
            , active: properties[i].active
            , creator: user
            , creation: _date.getTime()
            , modifier: user
            , modified: _date.getTime()
            , deleter: false
            , deleted: false
        };
        _p.id = crypto.createHmac('sha256', config.secret).update(JSON.stringify(_p)).digest('hex')
        _properties.push(_p);
    }
    return _properties;
}

module.exports = router;
