var express = require('express');
var profile_model = require('../models/profile');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
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

module.exports = router;