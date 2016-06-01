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

module.exports = router;
