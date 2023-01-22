const express = require('express');
const subsidiary_model = require('../models/subsidiary');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral, errorMalformedParameters, errorObjectNotFound, successGeneral, errorInvalidParameter,
    successCreation
} = require('../helpers/responsesHelper');

/* GET subsidiary listing. */
router.get('/:token', auth, async (req, res) => {
    const subsidiaries = await subsidiary_model.all();
    if (subsidiaries) {
        return res.json(subsidiaries);
    }
    return errorGeneral(res);
});

/* Get one subsidiary */
router.get('/:token/:subsidiary', auth, async (req, res) => {
    const subsidiaryParamValidation = common.validateObjectId(req.params.subsidiary);
    if(!subsidiaryParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.subsidiary.paramSubsidiaryInvalid} ${subsidiaryParamValidation.message}`);
    }
    const result = await subsidiary_model.one(req.params.subsidiary);
    if (result === null) {
        return errorGeneral(res);
    }
    if(result === false){
        return errorObjectNotFound(res, config.messages.subsidiary.nonExistentSubsidiary);
    }
    return res.json(result);
});

/* POST subsidiary creation. */
router.post('/:token', auth, async (req, res) => {
    const data = req.body;
    const existentSubsidiary = await subsidiary_model.exists(data.reference);
    if (existentSubsidiary === null) {
        return errorGeneral(res);
    }
    if (existentSubsidiary.length > 0) {
        // reference already exists, don't create subsidiary
        return errorInvalidParameter(res, config.messages.subsidiary.notSaved, {
            fields: {
                reference: {
                    error: true,
                    message: config.messages.subsidiary.referenceExists,
                    value: data.reference
                }
            }
        });
    }

    const result = await subsidiary_model.add(data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    const lastInsertedId = await subsidiary_model.lastInsertedId();
    await log.save(req.user.id, 'subsidiary','add', lastInsertedId._id, data,[]);
    return successCreation(res, config.messages.subsidiary.addedSuccessfully, lastInsertedId);
});

/* POST subsidiary update. */
router.put('/:token/:subsidiary', auth, async (req, res) => {
    const subsidiaryParamValidation = common.validateObjectId(req.params.subsidiary);
    if(!subsidiaryParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.subsidiary.paramSubsidiaryInvalid} ${subsidiaryParamValidation.message}`);
    }

    const existentSubsidiary = await subsidiary_model.one(req.params.subsidiary);
    if (existentSubsidiary === null) {
        return errorGeneral(res);
    }
    if (existentSubsidiary === false) {
        return errorObjectNotFound(res, config.messages.subsidiary.nonExistentSubsidiary);
    }

    const result = await subsidiary_model.update(req.params.subsidiary, data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'subsidiary','update', req.params.subsidiary, data,existentSubsidiary);
    return successGeneral(res, config.messages.subsidiary.updatedSuccessfully);
});

/* DELETE subsidiary elimination. */
router.delete('/:token/:subsidiary', auth, async (req, res) => {
    const subsidiaryParamValidation = common.validateObjectId(req.params.subsidiary);
    if(!subsidiaryParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.subsidiary.paramSubsidiaryInvalid} ${subsidiaryParamValidation.message}`);
    }
    const doc = await subsidiary_model.one(req.params.subsidiary);
    if(doc === null) {
        return errorGeneral(res);
    }
    if(doc === false) {
        return errorObjectNotFound(res, config.messages.subsidiary.nonExistentSubsidiary);
    }

    const result = await subsidiary_model.delete(req.params.subsidiary, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'subsidiary','delete', req.params.subsidiary, [], doc);
    return successGeneral(res, config.messages.subsidiary.deletedSuccessfully);
});

module.exports = router;
