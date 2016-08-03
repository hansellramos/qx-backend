var express = require('express');
var config = require('../config');
var auth_model = require('../models/auth');
var user_model = require('../models/user');
var sha1 = require('sha1');
var router = express.Router();

router.post('/:token', function(req, res, next){
    auth_model.authenticate(req.body.username, sha1(req.body.password), function(error, doc){
        if(error){ cb(error);
        }else{
            console.log(doc);
            if(doc){
                var token = {
                    user: doc.id
                    , iat: (new Date()).getTime()
                    , expires: (new Date()).getTime() + config.sessionTimelife
                };
                token.token = auth_model.generate(auth_model.complete(token));
                auth_model.insert(token, function(error){
                    if(error){
                        res.status(503).json({
                            success:false,
                            message:config.messages.auth.authenticationIncomplete,
                            data:{}
                        });
                    }
                    else{
                        res.json({
                            success:true,
                            message:'',
                            data:{
                                token:token.token
                            }
                        });
                    }
                });
            }else{
                res.status(401).json({
                    success:false,
                    message:config.messages.auth.authenticationFailed,
                    data:{}
                });
            }
        }
    })
});

router.get('/:token', function(req, res, next){
    auth_model.verify(req.params.token, function(token){
        if(token){
            if(token.expires < (new Date()).getTime()){
                res.status(404).json({
                    success:false,
                    message:config.messages.auth.expiredToken,
                    data:{}
                });
            }else{
                user_model.oneById(token.user, function(error, user){
                    user.password = '';
                    token.user = user;
                    res.json({
                        success:true,
                        message:'',
                        data:{
                            token:token
                        }
                    });
                });
            }
        }else{
            res.status(404).json({
                success:false,
                message:config.messages.auth.nonExistentToken,
                data:{}
            });
        }
    });
});

router.delete('/:token', function(req, res, next){
    auth_model.verify(req.params.token, function(token){
        if(token){
            if(token.expires < (new Date()).getTime()){
                res.status(404).json({
                    success:false,
                    message:config.messages.auth.expiredToken,
                    data:{}
                });
            }else{
                auth_model.delete(token.token, function(error, user){
                    res.json({
                        success:true,
                        message:config.messages.auth.ses,
                        data:{}
                    });
                });
            }
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
