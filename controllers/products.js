var express = require('express');
var product_model = require('../models/product');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var crypto = require('crypto');
var router = express.Router();

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
                                        res.json({
                                            success: true,
                                            message: config.messages.product.deletedSuccessfully,
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
        var _p = {
            id:''
            , name: properties[i].name
            , validations: properties[i].validations
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
