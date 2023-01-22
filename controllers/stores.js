const express = require('express');
const store_model = require('../models/store');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral, errorMalformedParameters, errorObjectNotFound, successGeneral, errorInvalidParameter,
    successCreation
} = require('../helpers/responsesHelper');

/* GET stores listing. */
router.get('/:token', auth, async (req, res) => {
    const stores = await store_model.all();
    if (stores) {
        return res.json(stores);
    }
    return errorGeneral(res);
});

/* Get one store */
router.get('/:token/:store', auth, async (req, res) => {
    const storeParamValidation = common.validateObjectId(req.params.store);
    if(!storeParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.store.paramStoreInvalid} ${storeParamValidation.message}`);
    }

    const result = await store_model.one(req.params.store);
    if (result === null) {
        return errorGeneral(res);
    }
    if(result === false) {
        return errorObjectNotFound(res, config.messages.store.nonExistentStore);
    }
    return res.json(result);
});

/* POST store creation. */
router.post('/:token', auth, async (req, res) => {
    const data = req.body;
    // check if reference already exists
    const existentStore = await store_model.exists(data.reference);
    if(existentStore === null) {
        return errorGeneral(res);
    }
    // if exists, don't create new
    if(existentStore.length > 0) {
        return errorInvalidParameter(res, config.messages.store.notSaved, {
            fields: {
                reference: {
                    error: true,
                    message: config.messages.store.referenceExists,
                    value: data.reference
                }
            }
        });
    }

    const result = await store_model.add(data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    const lastInsertedId = await store_model.lastInsertedId();
    await log.save(req.user.id, 'store','add', lastInsertedId._id, data,[]);
    return successCreation(res, config.messages.store.addedSuccessfully, lastInsertedId);
});

/* POST store update. */
router.put('/:token/:store', auth, async (req, res) => {
    const storeParamValidation = common.validateObjectId(req.params.store);
    if(!storeParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.store.paramStoreInvalid} ${storeParamValidation.message}`);
    }

    const existentStore = await store_model.exists(req.params.store);
    if(existentStore === null) {
        return errorGeneral(res);
    }
    if(existentStore === false) {
        return errorObjectNotFound(res, config.messages.store.nonExistentStore);
    }

    const exist = await store_model.exists(req.body.reference);
    if(exist === null) {
        return errorGeneral(res);
    }
    if(exist.length > 0 && exist[0]._id.toString() !== req.params.store) {
        return errorInvalidParameter(res, config.messages.store.notSaved, {
            fields: {
                reference: {
                    error: true,
                    message: config.messages.store.referenceExists,
                    value: req.body.reference
                }
            }
        });
    }

    const result = await store_model.update(req.params.store, req.body, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'store','update', req.params.store, req.body, existentStore);
    return successGeneral(res, config.messages.store.updatedSuccessfully);
});

/* DELETE store elimination. */
router.delete('/:token/:store', auth, async (req, res) => {
    const storeParamValidation = common.validateObjectId(req.params.store);
    if(!storeParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.store.paramStoreInvalid} ${storeParamValidation.message}`);
    }
    const doc = await store_model.one(req.params.store);
    if (doc === null) {
        return errorGeneral(res);
    }
    if(doc === false) {
        return errorObjectNotFound(res, config.messages.store.nonExistentStore);
    }

    const result = await store_model.delete(req.params.store, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'store','delete', req.params.store, [], doc);
    return successGeneral(res, config.messages.store.deletedSuccessfully);
});

module.exports = router;
