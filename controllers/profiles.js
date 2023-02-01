const express = require('express');
const profile_model = require('../models/profile');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral, errorInvalidParameter, errorObjectNotFound, successGeneral, successCreation,
    errorMalformedParameters
} = require("../helpers/responsesHelper");

/* GET profiles listing. */
router.get('/:token', auth, async (req, res) => {
    const profiles = await profile_model.all();
    if (profiles == null) {
        return errorGeneral(res);
    }

    return res.json(profiles);
});

/* Get one profile */
router.get('/:token/:profile', auth, async (req, res) => {
    const profileParamValidation = common.validateObjectId(req.params.profile);
    if(!profileParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.profile.paramProfileInvalid+" "+profileParamValidation.message,
            data:{}
        });
    }
    const profile = await profile_model.one(req.params.profile);
    if (profile === null) {
        return errorGeneral(res);
    }

    if(profile === false){
        return res.status(404).json({
            success:false,
            message:config.messages.profile.nonExistentProfile,
            data:{}
        });
    }

    return res.json(profile);
});

/* POST profile creation. */
router.post('/:token', auth, async (req, res) => {
    const data = req.body;
    const result = await profile_model.add(data, req.user.id);
    if (!result) {
        return errorGeneral(res);
    }
    const lastInsertedId = await profile_model.lastInsertedId();
    await log.save(req.user.id, 'profile','add', lastInsertedId._id, data,[]);
    return successCreation(res, config.messages.profile.addedSuccessfully, lastInsertedId);
});

/* POST profile update. */
router.put('/:token/:profile', auth, async (req, res) => {
    const profileParamValidation = common.validateObjectId(req.params.profile);
    if (!profileParamValidation.validation) {
      return errorMalformedParameters(res, `${config.messages.profile.paramProfileInvalid} ${profileParamValidation.message}`);
    }

    // Check if profile exists
    const existentProfile = await profile_model.one(req.params.profile);
    if (existentProfile === null) {
        return errorGeneral(res);
    }
    if (existentProfile === false) {
        return errorObjectNotFound(res, config.messages.profile.nonExistentProfile);
    }

    const data = req.body;
    const result = await profile_model.update(req.params.profile, data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'profile', 'update', req.params.profile, data, existentProfile);
    return successGeneral(res, config.messages.profile.updatedSuccessfully);
});

/* DELETE profile elimination. */
router.delete('/:token/:profile', auth, async (req, res) => {
    const profileParamValidation = common.validateObjectId(req.params.profile);
    if(!profileParamValidation.validation){
        return errorInvalidParameter(res, `${config.messages.profile.paramProfileInvalid} ${profileParamValidation.message}`);
    }
    const profile = await profile_model.one(req.params.profile);
    if (profile === null) {
        return errorGeneral(res);
    }
    if (profile === false) {
        return errorObjectNotFound(res, config.messages.profile.nonExistentProfile);
    }

    const result = await profile_model.delete(req.params.profile, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'profile', 'delete', req.params.profile, [], profile);
    return successGeneral(res, config.messages.profile.deletedSuccessfully);
});

module.exports = router;
