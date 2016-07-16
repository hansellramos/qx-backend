var express = require('express');
var record_model = require('../models/record');
var product_model = require('../models/product');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var router = express.Router();

/* GET records listing. */
router.get('/:token/:product', function (req, res, next) {
    if(req.params.product){
        var productParamValidation = common.validateObjectId(req.params.product);
        if(!productParamValidation.validation){
            res.status(417).json({
                success:false,
                message:config.messages.product.paramProductInvalid+" "+productParamValidation.message,
                data:{}
            });
        }else {
            auth_model.verify(req.params.token, function (valid) {
                if (valid) {
                    auth_model.refresh(req.params.token, function () {
                        product_model.one(req.params.product, function (error, product) {
                            if (error) {
                                res.status(503).json({
                                    success: false,
                                    message: config.messages.general.error_500,
                                    data: {}
                                });
                            } else {
                                if(product==null){
                                    res.status(404).json({
                                        success:false,
                                        message:config.messages.product.nonExistentProduct,
                                        data:{}
                                    });
                                }else {
                                    record_model.all(product, function (error, result) {
                                        if (error) {
                                            res.status(503).json({
                                                success: false,
                                                message: config.messages.general.error_500,
                                                data: {}
                                            });
                                        }
                                        else {
                                            res.json(result);
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
    }else{
        res.status(417).json({
            success:false,
            message:config.messages.record.paramProductMissed,
            data:{}
        });
    }

});

/* Get one record */
router.get('/:token/:product/:record', function (req, res, next) {
    var productParamValidation = common.validateObjectId(req.params.product);
    var recordParamValidation = common.validateObjectId(req.params.record);
    if(!productParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.product.paramProductInvalid+" "+productParamValidation.message,
            data:{}
        });
    }else if(!recordParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.record.paramRecordInvalid+" "+recordParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function(valid){
            if(valid){
                auth_model.refresh(req.params.token, function(){
                    record_model.one(req.params.record, function(error, result){
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
                                    message:config.messages.record.nonExistentRecord,
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

/* POST record creation. */
router.post('/:token/:product', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            var currentUser = valid.user;
            auth_model.refresh(req.params.token, function(){
                var data = req.body;
                data.properties = completeProperties(data.properties, currentUser);
                record_model.exists(data.reference, function(error, docs){
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
                                message:config.messages.record.notSaved,
                                data:{
                                    fields: {
                                        reference: {
                                            error: true,
                                            message: config.messages.record.referenceExists,
                                            value: data.reference
                                        }
                                    }
                                }
                            });
                        }else{
                            record_model.add(data, currentUser, function(error, result){
                                if(error){
                                    res.status(503).json({
                                        success:false,
                                        message:config.messages.general.error_500+error,
                                        data:{}
                                    });
                                }else{
                                    res.json({
                                        success: true,
                                        message: config.messages.record.addedSuccessfully,
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

/* DELETE record elimination. */
router.delete('/:token/:record', function (req, res, next) {
    var recordParamValidation = common.validateObjectId(req.params.record);
    if(!recordParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.record.paramRecordInvalid+" "+recordParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function (valid) {
            if (valid) {
                var currentUser = valid.user;
                auth_model.refresh(req.params.token, function () {
                    var data = req.body;
                    record_model.one(req.params.record, function (error, docs) {
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
                                    message:config.messages.record.nonExistentRecord,
                                    data:{}
                                });
                            } else {
                                record_model.delete(req.params.record, currentUser, function (error) {
                                    if (error) {
                                        res.status(503).json({
                                            success: false,
                                            message: config.messages.general.error_500 + error,
                                            data: {}
                                        });
                                    } else {
                                        res.json({
                                            success: true,
                                            message: config.messages.record.deletedSuccessfully,
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

function completeProperties(properties, user){
    var _properties = [];
    var _date = new Date();
    for (var i in properties){
        _properties.push({
            property:properties[i].property
            , value:properties[i].value
            , creator: user
            , creation: _date.getTime()
            , modifier: user
            , modified: _date.getTime()
            , deleter: false
            , deleted: false
        });
    }
    return _properties;
}

module.exports = router;
