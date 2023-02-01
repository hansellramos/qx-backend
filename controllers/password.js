const express = require('express');
const config = require('../config');
const log = require('../models/internal/log');
const user_model = require('../models/user');
const sha1 = require('sha1');
const router = express.Router();
const common = require('../common');
const auth = require('../middleware/auth');
const {errorGeneral, errorMalformedParameters, errorObjectNotFound, errorAuthenticationFailed, successGeneral} = require('../helpers/responsesHelper');

/* POST user password update. */
router.put('/:token', auth, async (req, res) => {
    const data = req.body;
    if(!data.old || !data.new || !data.repeat){
        return errorMalformedParameters(res, config.messages.user.paramsInvalid);
    }
    if (data.new !== data.repeat) {
        return errorMalformedParameters(res, config.messages.user.passwordsNotMatch);
    }

    // Check if the old password is correct
    const currentUser = req.user;
    const doc = await user_model.oneByUsername(currentUser.username);
    if (doc === null) {
        return errorGeneral(res);
    }
    if (doc === false) {
        return errorObjectNotFound(res, config.messages.user.nonExistentUser);
    }
    let password;
    if(doc.passwordLastUpdate){
        const salt = doc.password.substring(41, doc.password.length -2);
        password = common.generatePassword(data.old, salt);
    }else{
        password = sha1(req.body.password);
    }
    if (password !== doc.password) {
        return errorAuthenticationFailed(res);
    }

    // update password
    const newData = {
        'password': data.new
        , 'passwordLastUpdate': (new Date()).getTime()
    };
    const result = await user_model.update(doc._id, newData, currentUser);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(currentUser, 'user','update-password', doc._id, newData, doc);
    return successGeneral(res, config.messages.user.updatedSuccessfully);

});

module.exports = router;
