var express = require('express');
var store_model = require('../models/store');
var auth_model = require('../models/auth');
var config = require('../config');
var common = require('../common');
var router = express.Router();

/* GET stores listing. */
router.get('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
            auth_model.refresh(req.params.token, function(){
                store_model.all(function(error, result){
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

/* Get one store */
router.get('/:token/:store', function (req, res, next) {
    var storeParamValidation = common.validateObjectId(req.params.store);
    if(!storeParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.store.paramStoreInvalid+" "+storeParamValidation.message,
            data:{}
        });
    }else{
        auth_model.verify(req.params.token, function(valid){
            if(valid){
                auth_model.refresh(req.params.token, function(){
                    store_model.one(req.params.store, function(error, result){
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
                                    message:config.messages.store.nonExistentStore,
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
