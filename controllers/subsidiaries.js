var express = require('express');
var subsidiary_model = require('../models/subsidiary');
var auth_model = require('../models/auth');
var config = require('../config');
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

/* POST subsidiary creation. */
router.post('/:token', function (req, res, next) {
    auth_model.verify(req.params.token, function(valid){
        if(valid){
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
                        console.log({docs:docs});
                        if(docs.length>0){ //exists, don't create new
                            res.status(406).json({
                                success:false,
                                message:config.messages.subsidiary.notSaved,
                                data:{
                                    fields: {
                                        reference: config.messages.subsidiary.referenceExists
                                    }
                                }
                            });
                        }else{
                            res.json({});
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

module.exports = router;
