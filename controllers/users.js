var express = require('express');
var user_model = require('../models/user');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var router = express.Router();

/* GET users listing. */
router.get('/:token', function (req, res, next) {
  auth_model.verify(req.params.token, function(valid){
    if(valid){
      auth_model.refresh(req.params.token, function(){
        user_model.all(function(error, result){
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

/* Get one user */
router.get('/:token/:user', function (req, res, next) {
  var userParamValidation = common.validateObjectId(req.params.user);
  if(!userParamValidation.validation){
    res.status(417).json({
      success:false,
      message:config.messages.user.paramUserInvalid+" "+userParamValidation.message,
      data:{}
    });
  }else{
    auth_model.verify(req.params.token, function(valid){
      if(valid){
        auth_model.refresh(req.params.token, function(){
          user_model.one(req.params.user, function(error, result){
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
                  message:config.messages.user.nonExistentUser,
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

/* DELETE user elimination. */
router.delete('/:token/:user', function (req, res, next) {
  var userParamValidation = common.validateObjectId(req.params.user);
  if(!userParamValidation.validation){
    res.status(417).json({
      success:false,
      message:config.messages.user.paramUserInvalid+" "+userParamValidation.message,
      data:{}
    });
  }else{
    auth_model.verify(req.params.token, function (valid) {
      if (valid) {
        var currentUser = valid.user;
        auth_model.refresh(req.params.token, function () {
          var data = req.body;
          user_model.one(req.params.user, function (error, docs) {
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
                  message:config.messages.user.nonExistentUser,
                  data:{}
                });
              } else {
                user_model.delete(req.params.user, currentUser, function (error) {
                  if (error) {
                    res.status(503).json({
                      success: false,
                      message: config.messages.general.error_500 + error,
                      data: {}
                    });
                  } else {
                    res.json({
                      success: true,
                      message: config.messages.user.deletedSuccessfully,
                      data: {}
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
