var express = require('express');
var product_model = require('../models/product');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var log = require('../models/internal/log');
var crypto = require('crypto');
var router = express.Router();
var sha1 = require('sha1');

/* GET product listing. */
router.get('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            auth_model.refresh(req.params.token, function(){
                product_model.all(function(error, result){
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

/* GET one product. */
router.get('/:token/:product', function (req, res, next) {
    var productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.product.paramProductInvalid+" "+productParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function(valid){
            if(valid){
                auth_model.refresh(req.params.token, function(){
                    product_model.one(req.params.product, function(error, result){
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
                                    message:config.messages.product.nonExistentProduct,
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

/* POST product creation. */
router.post('/:token/', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            var currentUser = valid.user;
            auth_model.refresh(req.params.token, function(){
                var data = req.body;
                data.properties = completeProperties(data.properties, currentUser);
                product_model.exists(data.reference, function(error, docs){
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
                                message:config.messages.product.notSaved,
                                data:{
                                    fields: {
                                        reference: {
                                            error: true,
                                            message: config.messages.product.referenceExists,
                                            value: data.reference
                                        }
                                    }
                                }
                            });
                        }else{
                            product_model.add(data, currentUser, function(error, result){
                                if(error){
                                    res.status(503).json({
                                        success:false,
                                        message:config.messages.general.error_500+error,
                                        data:{}
                                    });
                                }else{
                                    product_model.lastInsertedId(function(error, result){
                                        log.save(currentUser, 'product','add', result._id, data,[], function(error){
                                            if(error){ }else{
                                                res.json({
                                                    success: true,
                                                    message: config.messages.product.addedSuccessfully,
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

/* PUT product update. */
router.put('/:token/:product', function (req, res, next) {
    var productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.product.paramProductInvalid+" "+productParamValidation.message,
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
                    product_model.one(req.params.product, function (error, docs) {
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
                                    message:config.messages.product.nonExistentProduct,
                                    data:{}
                                });
                            } else {
                                //////
                                if(data.properties){
                                    data.properties = parseProductProperties(data.modifier, data.modified, docs.properties, data.properties);
                                }
                                product_model.update(req.params.product, data, currentUser, function (error, result) {
                                    if (error) {
                                        res.status(503).json({
                                            success: false,
                                            message: config.messages.general.error_500 + error,
                                            data: {}
                                        });
                                    } else {
                                        log.save(currentUser, 'product','update', req.params.product, data, docs, function(error){
                                            if(error){ }else{
                                                res.json({
                                                    success: true,
                                                    message: config.messages.product.updatedSuccessfully,
                                                    data: {}
                                                });
                                            }
                                        });
                                    }
                                });
                                /////
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

function parseProductProperties(modifier, modified, oldProperties, newProperties) {
    var properties = [];
    for(var n in newProperties){
        var newProperty = newProperties[n];
        var p = {
            id: newProperty.id ? newProperty.id : ''
            , name: newProperty.name
            , validation: newProperty.validation
            , active: newProperty.active
        };

        if(newProperty.remission_editable){
            p.remission_editable = newProperty.remission_editable;
        }

        if(newProperty.status == 'added' || p.id === ''){
            p.id = sha1(JSON.stringify(p));
            p.created = modified;
            p.creator = modifier;
            newProperty.status = 'updated';
        }else{
            p.created = modified;
            p.created = modifier;
        }

        if(newProperty.status === 'updated'){
            p.modified = modified;
            p.modifier = modifier;
        }

        if(newProperty.deleted === true){
            p.deleted = modified;
            p.deleter = modifier;
        }else{
            p.deleted = p.deleter = false;
        }

        properties.push(p);
    }
    return properties;
}

/* DELETE product elimination. */
router.delete('/:token/:product', function (req, res, next) {
    var productParamValidation = common.validateObjectId(req.params.product);
    if(!productParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.product.paramProductInvalid+" "+productParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function (valid) {
            if (valid) {
                var currentUser = valid.user;
                auth_model.refresh(req.params.token, function () {
                    var data = req.body;
                    data.properties = completeProperties(data.properties, currentUser);
                    product_model.one(req.params.product, function (error, docs) {
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
                                    message:config.messages.product.nonExistentProduct,
                                    data:{}
                                });
                            } else {
                                product_model.delete(req.params.product, currentUser, function (error) {
                                    if (error) {
                                        res.status(503).json({
                                            success: false,
                                            message: config.messages.general.error_500 + error,
                                            data: {}
                                        });
                                    } else {
                                        log.save(currentUser, 'product','delete', req.params.product, [], docs, function(error){
                                            if(error){ }else{
                                                res.json({
                                                    success: true,
                                                    message: config.messages.product.deletedSuccessfully,
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

function completeProperties(properties, user){
    var _properties = [];
    var _date = new Date();
    for (var i in properties){
        var _p = {
            id:''
            , name: properties[i].name
            , validation: properties[i].validation
            , remission_editable: properties[i].remission_editable
            , active: properties[i].active
            , creator: user
            , creation: _date.getTime()
            , modifier: user
            , modified: _date.getTime()
            , deleter: false
            , deleted: false
        };
        _p.id = crypto.createHmac('sha256', config.secret).update(JSON.stringify(_p)).digest('hex')
        _properties.push(_p);
    }
    return _properties;
}

module.exports = router;
