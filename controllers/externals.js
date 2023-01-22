const express = require('express');
const external_model = require('../models/external');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral, errorMalformedParameters, errorObjectNotFound, successGeneral, successCreation} = require("../helpers/responsesHelper");

/* GET externals listing. */
router.get('/:token', auth, async (req, res) => {
    const externals = await external_model.all();
    if (externals == null) {
        return errorGeneral(res);
    }
    return res.json(externals);
});

/* Get one external */
router.get('/:token/:external', auth, async (req, res) => {
    const externalParamValidation = common.validateObjectId(req.params.external);
    if(!externalParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.external.paramExternalInvalid} ${externalParamValidation.message}`);
    }
    const external = await external_model.one(req.params.external);
    if (external === null) {
        return errorGeneral(res);
    }
    if (external === false) {
        return errorObjectNotFound(res, config.messages.external.nonExistentExternal);
    }
    return res.json(external);
});

/* POST external creation. */
router.post('/:token', auth, async (req, res) => {
    const data = req.body;
    const existentExternal = await external_model.exists(data.name);
    if (existentExternal === null) {
        return errorGeneral(res);
    }
    if (existentExternal.length > 0) {
        // name already exists, don't create external
        return errorMalformedParameters(res, config.messages.external.notSaved, {
            fields: {
                name: {
                    error: true,
                    message: config.messages.external.nameExists,
                    value: data.name
                }
            }
        });
    }

    const result = await external_model.add(data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    const lastInsertedId = await external_model.lastInsertedId();
    await log.save(req.user.id, 'external','add', lastInsertedId._id, data,[]);
    return successCreation(res, config.messages.external.addedSuccessfully, lastInsertedId);
});

/* POST external update. */
router.put('/:token/:external', auth, async (req, res) => {
    const externalParamValidation = common.validateObjectId(req.params.external);
    if(!externalParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.external.paramExternalInvalid} ${externalParamValidation.message}`);
    }

    const existentExternal = await external_model.one(req.params.external);
    if (existentExternal === null) {
        return errorGeneral(res);
    }
    if (existentExternal === false) {
        return errorObjectNotFound(res, config.messages.external.nonExistentExternal);
    }

    const data = req.body;
    const result = await external_model.update(req.params.external, data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'external','update', req.params.external, data, existentExternal);
    return successGeneral(res, config.messages.external.updatedSuccessfully);
});

/* DELETE external elimination. */
router.delete('/:token/:external', auth, async (req, res) => {
    const externalParamValidation = common.validateObjectId(req.params.external);
    if(!externalParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.external.paramExternalInvalid} ${externalParamValidation.message}`);
    }
    const external = await external_model.one(req.params.external);
    if (external === null) {
        return errorGeneral(res);
    }
    if (external === false) {
        return errorObjectNotFound(res, config.messages.external.nonExistentExternal);
    }
    const result = await external_model.delete(req.params.external, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'external', 'delete', req.params.external, [], external);
    return successGeneral(res, config.messages.external.deletedSuccessfully);
});

module.exports = router;
