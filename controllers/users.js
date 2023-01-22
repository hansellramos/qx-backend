const express = require('express');
const user_model = require('../models/user');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral, errorMalformedParameters, errorObjectNotFound, successGeneral, errorAuthenticationFailed,
  successCreation, errorInvalidParameter
} = require('../helpers/responsesHelper');

/* GET users listing. */
router.get('/:token', auth, async (req, res) => {
  const users = await user_model.all();
  if (users) {
    return res.json(users);
  }
  return errorGeneral(res);
});

/* Get one user */
router.get('/:token/:user', auth, async (req, res) => {
  const userParamValidation = common.validateObjectId(req.params.user);
  if(!userParamValidation.validation){
    return errorMalformedParameters(res, `${config.messages.user.paramUserInvalid} ${userParamValidation.message}`);
  }

  const result = await user_model.one(req.params.user);
  if (result == null) {
    return errorGeneral(res);
  }
  if(result === false){
    return errorObjectNotFound(res, config.messages.user.nonExistentUser);
  }
  return res.json(result);
});

/* POST user creation. */
router.post('/:token', auth, async (req, res) => {
  const data = req.body;
  delete data.repeatPassword;
  const existentUser = await user_model.exists(data.username);
  if (existentUser && existentUser.length > 0) {
    // username already exists, don't create user
    return errorAuthenticationFailed(res, config.messages.user.notSaved, {
      username: config.messages.user.usernameExists
    });
  }

  const result = await user_model.add(data, req.user.id);
  if (result === null) {
    return errorGeneral(res);
  }
  const lastInsertedId = await user_model.lastInsertedId();
  await log.save(req.user.id, 'user','add', lastInsertedId._id, data,[]);
  return successCreation(res, config.messages.user.addedSuccessfully, lastInsertedId);
});

/* POST user update. */
router.put('/:token/:user', auth, async (req, res) => {
    const userParamValidation = common.validateObjectId(req.params.user);
    if(!userParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.user.paramUserInvalid} ${userParamValidation.message}`);
    }
    const data = req.body;
    const currentUser = req.user;

    // if user is updating his username, check if it already exists
    if (data.username) {
        const existentUser = await user_model.exists(data.username);
        if (existentUser && existentUser.length > 0 && existentUser[0]._id.toString() !== req.params.user) {
            // username already exists, don't update user
            return errorInvalidParameter(res, config.messages.user.notSaved, {
                fields: {
                    username: {
                        error: true,
                        message: config.messages.user.usernameExists,
                        value: data.username
                    }
                }
            });
        }
    }

    const existentUser = await user_model.one(req.params.user);
    if (existentUser == null) {
        return errorGeneral(res);
    }
    if (existentUser === false) {
        return errorObjectNotFound(res, config.messages.user.nonExistentUser);
    }

    const result = await user_model.update(req.params.user, data, currentUser);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(currentUser, 'user','update', req.params.user, data, existentUser);
    return successGeneral(res, config.messages.user.updatedSuccessfully);
});

/* DELETE user elimination. */
router.delete('/:token/:user', auth, async (req, res) => {
  const userParamValidation = common.validateObjectId(req.params.user);
  if(!userParamValidation.validation){
      return errorMalformedParameters(res, `${config.messages.user.paramUserInvalid} ${userParamValidation.message}`);
  }
  const doc = await user_model.one(req.params.user);
  if (doc === null) {
      return errorGeneral(res);
  }
  if (doc === false) {
      return errorObjectNotFound(res, config.messages.user.nonExistentUser);
  }
  const result = await user_model.delete(req.params.user, req.user.id);
  if (result === null) {
    return errorGeneral(res);
  }
  await log.save(req.user, 'user','delete', req.params.user, [], doc);
  return successGeneral(res, config.messages.user.deletedSuccessfully);
});

module.exports = router;
