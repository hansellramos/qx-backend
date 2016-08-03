var express = require('express');
var subsidiary_model = require('../models/subsidiary');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var log = require('../models/internal/log');
var router = express.Router();

/* GET subsidiary listing. */
router.get('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            auth_model.refresh(req.params.token, function(){
                subsidiary_model.all(function(error, result){
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

/* Get one subsidiary */
router.get('/:token/:subsidiary', function (req, res, next) {
    var subsidiaryParamValidation = common.validateObjectId(req.params.subsidiary);
    if(!subsidiaryParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.subsidiary.paramSubsidiaryInvalid+" "+subsidiaryParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function(valid){
            if(valid){
                auth_model.refresh(req.params.token, function(){
                    subsidiary_model.one(req.params.subsidiary, function(error, result){
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
                                    message:config.messages.subsidiary.nonExistentSubsidiary,
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

/* POST subsidiary creation. */
router.post('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            var currentUser = valid.user;
            auth_model.refresh(req.params.token, function(){
                var data = req.body;
                subsidiary_model.exists(data.reference, function(error, docs){
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
                                message:config.messages.subsidiary.notSaved,
                                data:{
                                    fields: {
                                        reference: {
                                            error: true,
                                            message: config.messages.subsidiary.referenceExists,
                                            value: data.reference
                                        }
                                    }
                                }
                            });
                        }else{
                            subsidiary_model.add(data, currentUser, function(error, result){
                                if(error){
                                    res.status(503).json({
                                        success:false,
                                        message:config.messages.general.error_500+error,
                                        data:{}
                                    });
                                }else{
                                    subsidiary_model.lastInsertedId(function(error, result){
                                        log.save(currentUser, 'subsidiary','add', req.params.subsidiary, data,[], function(error){
                                            if(error){ }else{
                                                res.json({
                                                    success: true,
                                                    message: config.messages.subsidiary.addedSuccessfully,
                                                    data:{
                                                        result: result
                                                    }
                                                });
                                            }
                                        });
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

/* POST subsidiary update. */
router.put('/:token/:subsidiary', function (req, res, next) {
    var subsidiaryParamValidation = common.validateObjectId(req.params.subsidiary);
    if(!subsidiaryParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.subsidiary.paramSubsidiaryInvalid+" "+subsidiaryParamValidation.message,
            data:{}
        });
    }else {
        auth_model.verify(req.params.token, function (valid) {
            if (valid) {
                var currentUser = valid.user;
                auth_model.refresh(req.params.token, function () {
                    var data = req.body;
                    //update flags
                    data.modifier = currentUser;
                    data.modified = (new Date()).getTime();
                    subsidiary_model.one(req.params.subsidiary, function (error, docs) {
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
                                    message:config.messages.subsidiary.nonExistentSubsidiary,
                                    data:{}
                                });
                            } else {
                                subsidiary_model.update(req.params.subsidiary, data, currentUser, function (error, result) {
                                    if (error) {
                                        res.status(503).json({
                                            success: false,
                                            message: config.messages.general.error_500 + error,
                                            data: {}
                                        });
                                    } else {
                                        log.save(currentUser, 'subsidiary','update', req.params.subsidiary, data, docs, function(error){
                                            if(error){ }else{
                                                res.json({
                                                    success: true,
                                                    message: config.messages.subsidiary.updatedSuccessfully,
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

/* DELETE subsidiary elimination. */
router.delete('/:token/:subsidiary', function (req, res, next) {
    var subsidiaryParamValidation = common.validateObjectId(req.params.subsidiary);
    if(!subsidiaryParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.subsidiary.paramSubsidiaryInvalid+" "+subsidiaryParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function (valid) {
            if (valid) {
                var currentUser = valid.user;
                auth_model.refresh(req.params.token, function () {
                    var data = req.body;
                    subsidiary_model.one(req.params.subsidiary, function (error, docs) {
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
                                    message:config.messages.subsidiary.nonExistentSubsidiary,
                                    data:{}
                                });
                            } else {
                                subsidiary_model.delete(req.params.subsidiary, currentUser, function (error) {
                                    if (error) {
                                        res.status(503).json({
                                            success: false,
                                            message: config.messages.general.error_500 + error,
                                            data: {}
                                        });
                                    } else {
                                        log.save(currentUser, 'subsidiary','delete', req.params.subsidiary, [], docs, function(error){
                                            if(error){ }else{
                                                res.json({
                                                    success: true,
                                                    message: config.messages.subsidiary.deletedSuccessfully,
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
