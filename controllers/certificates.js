var express = require('express');
var certificate_model = require('../models/certificate');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var router = express.Router();

/* GET certificates listing. */
router.get('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            auth_model.refresh(req.params.token, function(){
                certificate_model.all(function(error, result){
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

/* GET one certificate. */
router.get('/:token/:certificate', function (req, res, next) {
    var certificateParamValidation = common.validateObjectId(req.params.certificate);
    if(!certificateParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.certificate.paramCertificateInvalid+" "+certificateParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function(valid){
            if(valid){
                auth_model.refresh(req.params.token, function(){
                    certificate_model.one(req.params.certificate, function(error, result){
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
                                    message:config.messages.certificate.nonExistentCertificate,
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

/* POST certificates creation. */
router.post('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            var currentUser = valid.user;
            auth_model.refresh(req.params.token, function(){
                var data = req.body;
                certificate_model.add(data, currentUser, function(error, result){
                    if(error){
                        res.status(503).json({
                            success:false,
                            message:config.messages.general.error_500+error,
                            data:{}
                        });
                    }else{
                        certificate_model.lastInsertedId(function(error, result){
                            res.json({
                                success: true,
                                message: config.messages.certificate.addedSuccessfully,
                                data:{
                                    result: result
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

/* DELETE certificate elimination. */
router.delete('/:token/:certificate', function (req, res, next) {
    var certificateParamValidation = common.validateObjectId(req.params.certificate);
    if(!certificateParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.certificate.paramCertificateInvalid+" "+certificateParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function (valid) {
            if (valid) {
                var currentUser = valid.user;
                auth_model.refresh(req.params.token, function () {
                    var data = req.body;
                    certificate_model.one(req.params.certificate, function (error, docs) {
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
                                    message:config.messages.certificate.nonExistentCertificatel,
                                    data:{}
                                });
                            } else {
                                certificate_model.delete(req.params.certificate, currentUser, function (error) {
                                    if (error) {
                                        res.status(503).json({
                                            success: false,
                                            message: config.messages.general.error_500 + error,
                                            data: {}
                                        });
                                    } else {
                                        res.json({
                                            success: true,
                                            message: config.messages.certificate.deletedSuccessfully,
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
