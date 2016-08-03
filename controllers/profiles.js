var express = require('express');
var profile_model = require('../models/profile');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var log = require('../models/internal/log');
var router = express.Router();

/* GET profiles listing. */
router.get('/:token', function (req, res, next) {
  auth_model.verify(req.params.token, function(valid){
    if(valid){
      auth_model.refresh(req.params.token, function(){
        profile_model.all(function(error, result){
          if(error){
            res.status(503).json({
              success:false,
              message:config.messages.general.error_500,
              data:{}
            });
          }
          else {
            res.json(result);
          }
        });
      });
    }else{
      res.status(404).json({
        success:false,
        message:config.messages.auth.nonExistentToken,
        data:{}
      });
    }
  });
});

/* Get one profile */
router.get('/:token/:profile', function (req, res, next) {
  var profileParamValidation = common.validateObjectId(req.params.profile);
  if(!profileParamValidation.validation){
    res.status(417).json({
      success:false,
      message:config.messages.profile.paramProfileInvalid+" "+profileParamValidation.message,
      data:{}
    });
  }else{
    auth_model.verify(req.params.token, function(valid){
      if(valid){
        auth_model.refresh(req.params.token, function(){
          profile_model.one(req.params.profile, function(error, result){
            if(error){
              res.status(503).json({
                success:false,
                message:config.messages.general.error_500,
                data:{}
              });
            }
            else {
              if(result==null){
                res.status(404).json({
                  success:false,
                  message:config.messages.profile.nonExistentProfile,
                  data:{}
                });
              }else{
                res.json(result);
              }
            }
          });
        });
      }else{
        res.status(404).json({
          success:false,
          message:config.messages.auth.nonExistentToken,
          data:{}
        });
      }
    });
  }
});

/* POST profile creation. */
router.post('/:token', function (req, res, next) {
  auth_model.verify(req.params.token, function(valid){
    if(valid){
      var currentUser = valid.user;
      auth_model.refresh(req.params.token, function(){
        var data = req.body;
        profile_model.add(data, currentUser, function(error){
          if(error){
            res.status(503).json({
              success:false,
              message:config.messages.general.error_500+error,
              data:{}
            });
          }else{
            profile_model.lastInsertedId(function(error, result){
              log.save(currentUser, 'profile','add', result._id, data,[], function(error){
                if(error){ }else{
                  res.json({
                    success: true,
                    message: config.messages.profile.addedSuccessfully,
                    data:{
                      result: result
                    }
                  });
                }
              });
            });
          }
        });
      });
    }else{
      res.status(404).json({
        success:false,
        message:config.messages.auth.nonExistentToken,
        data:{}
      });
    }
  });
});

/* POST profile update. */
router.put('/:token/:profile', function (req, res, next) {
  var profileParamValidation = common.validateObjectId(req.params.profile);
  if(!profileParamValidation.validation){
    res.status(417).json({
      success:false,
      message:config.messages.profile.paramProfileInvalid+" "+profileParamValidation.message,
      data:{}
    });
  }else{
    auth_model.verify(req.params.token, function (valid) {
      if (valid) {
        var currentUser = valid.user;
        auth_model.refresh(req.params.token, function () {
          var data = req.body;
          //update flags
          data.modifier = currentUser;
          data.modified = (new Date()).getTime();
          profile_model.one(req.params.profile, function (error, docs) {
            if (error) {
              res.status(503).json({
                success: false,
                message: config.messages.general.error_500,
                data: {}
              });
            }
            else {
              if (docs.length == 0) {
                res.status(404).json({
                  success:false,
                  message:config.messages.profile.nonExistentProfile,
                  data:{}
                });
              } else {

                profile_model.update(req.params.profile, data, currentUser, function (error, result) {
                  if (error) {
                    res.status(503).json({
                      success: false,
                      message: config.messages.general.error_500 + error,
                      data: {}
                    });
                  } else {
                    log.save(currentUser, 'profile', 'update', req.params.profile, data, docs, function (error) {
                      if (error) {
                      } else {
                        res.json({
                          success: true,
                          message: config.messages.profile.updatedSuccessfully,
                          data: {}
                        });
                      }
                    });
                  }
                });
              }
            }
          });
        });
      } else {
        res.status(404).json({
          success: false,
          message: config.messages.auth.nonExistentToken,
          data: {}
        });
      }
    });
  }
});

/* DELETE profile elimination. */
router.delete('/:token/:profile', function (req, res, next) {
  var profileParamValidation = common.validateObjectId(req.params.profile);
  if(!profileParamValidation.validation){
    res.status(417).json({
      success:false,
      message:config.messages.profile.paramProfileInvalid+" "+profileParamValidation.message,
      data:{}
    });
  }else{
    auth_model.verify(req.params.token, function (valid) {
      if (valid) {
        var currentUser = valid.user;
        auth_model.refresh(req.params.token, function () {
          var data = req.body;
          profile_model.one(req.params.profile, function (error, docs) {
            if (error) {
              res.status(503).json({
                success: false,
                message: config.messages.general.error_500,
                data: {}
              });
            }
            else {
              if (docs.length == 0) {
                res.status(404).json({
                  success:false,
                  message:config.messages.profile.nonExistentProfile,
                  data:{}
                });
              } else {
                profile_model.delete(req.params.profile, currentUser, function (error) {
                  if (error) {
                    res.status(503).json({
                      success: false,
                      message: config.messages.general.error_500 + error,
                      data: {}
                    });
                  } else {
                    log.save(currentUser, 'profile','delete', req.params.profile, [], docs, function(error){
                      if(error){ }else{
                        res.json({
                          success: true,
                          message: config.messages.profile.deletedSuccessfully,
                          data: {}
                        });
                      }
                    });
                  }
                });
              }
            }
          });
        });
      } else {
        res.status(404).json({
          success: false,
          message: config.messages.auth.nonExistentToken,
          data: {}
        });
      }
    });
  }
});

module.exports = router;
