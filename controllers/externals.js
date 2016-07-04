var express = require('express');
var external_model = require('../models/external');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var router = express.Router();

/* GET externals listing. */
router.get('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            auth_model.refresh(req.params.token, function(){
                external_model.all(function(error, result){
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

/* Get one external */
router.get('/:token/:external', function (req, res, next) {
    var externalParamValidation = common.validateObjectId(req.params.external);
    if(!externalParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.external.paramExternalInvalid+" "+externalParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function(valid){
            if(valid){
                auth_model.refresh(req.params.token, function(){
                    external_model.one(req.params.external, function(error, result){
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
                                    message:config.messages.external.nonExistentExternal,
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

/* POST external creation. */
router.post('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            var currentUser = valid.user;
            auth_model.refresh(req.params.token, function(){
                var data = req.body;
                external_model.exists(data.name, function(error, docs){
                    if(error){
                        res.status(503).json({
                            success:false,
                            message:config.messages.general.error_500,
                            data:{}
                        });
                    }
                    else {
                        if(docs.length>0){ //exists, don't create new
                            res.status(406).json({
                                success:false,
                                message:config.messages.external.notSaved,
                                data:{
                                    fields: {
                                        name: {
                                            error: true,
                                            message: config.messages.external.nameExists,
                                            value: data.name
                                        }
                                    }
                                }
                            });
                        }else{
                            external_model.add(data, currentUser, function(error){
                                if(error){
                                    res.status(503).json({
                                        success:false,
                                        message:config.messages.general.error_500+error,
                                        data:{}
                                    });
                                }else{
                                    res.json({
                                        success: true,
                                        message: config.messages.external.addedSuccessfully,
                                        data:{}
                                    });
                                }
                            });
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
});

/* DELETE external elimination. */
router.delete('/:token/:external', function (req, res, next) {
    var externalParamValidation = common.validateObjectId(req.params.external);
    if(!externalParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.external.paramExternalInvalid+" "+externalParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function (valid) {
            if (valid) {
                var currentUser = valid.user;
                auth_model.refresh(req.params.token, function () {
                    var data = req.body;
                    external_model.one(req.params.external, function (error, docs) {
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
                                    message:config.messages.external.nonExistentExternal,
                                    data:{}
                                });
                            } else {
                                external_model.delete(req.params.external, currentUser, function (error) {
                                    if (error) {
                                        res.status(503).json({
                                            success: false,
                                            message: config.messages.general.error_500 + error,
                                            data: {}
                                        });
                                    } else {
                                        res.json({
                                            success: true,
                                            message: config.messages.external.deletedSuccessfully,
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
