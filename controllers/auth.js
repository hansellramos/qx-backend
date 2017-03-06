var express = require('express');
var config = require('../config');
var log = require('../models/internal/log');
var auth_model = require('../models/auth');
var user_model = require('../models/user');
var sha1 = require('sha1');
var router = express.Router();
var common = require('../common');

router.post('/:token', function(req, res, next){
    user_model.oneByUsername(req.body.username, function(error, doc){
        if(error){ cb(error);
        }else{
            if(doc){
                var password = '';
                if(doc.passwordLastUpdate){
                    var salt = doc.password.substr(41,32);
                    password = common.generatePassword(req.body.password,salt);
                }else{
                    password = sha1(req.body.password);
                }
                auth_model.authenticate(req.body.username, password, function(error, doc){
                    if(error){ cb(error);
                    }else{
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
                                    log.save(token.user, 'auth','login', token.token, token, [], function(error) {
                                        res.json({
                                            success:true,
                                            message:'',
                                            data:{
                                                token:token.token
                                            }
                                        });
                                    });
                                }
                            });
                        }else{
                            log.save(req.body.username, 'auth','loginFailed', '', [], [], function(error) {
                                res.status(401).json({
                                    success: false,
                                    message: config.messages.auth.authenticationFailed,
                                    data: {}
                                });
                            });
                        }
                    }
                });
            }else{
                log.save(req.body.username, 'auth','loginFailed', '', [], [], function(error) {
                    res.status(404).json({
                        success: false,
                        message: config.messages.auth.usernameNotFound,
                        data: {}
                    });
                });
            }
        }
    });
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
                    log.save(token.user, 'auth','logout', token.token, [], token, function(error) {
                        res.json({
                            success: true,
                            message: config.messages.auth.endedTokenSucessfully,
                            data: {}
                        });
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
