var express = require('express');
var config = require('../config');
var log = require('../models/internal/log');
var auth_model = require('../models/auth');
var user_model = require('../models/user');
var sha1 = require('sha1');
var router = express.Router();
var common = require('../common');

/* POST user password update. */
router.put('/:token', function (req, res, next) {
    var userParamValidation = common.validateObjectId(req.params.user);
    if(!userParamValidation.validation){
        res.status(417).json({
            success:false,
            message:config.messages.user.paramUserInvalid+" "+userParamValidation.message,
            data:{}
        });
    }else {
        auth_model.verify(req.params.token, function (valid) {
            if (valid) {
                var currentUser = valid.user;
                var data = req.body;
                user_model.oneById(currentUser, function(error, user){
                   if(error){
                       res.status(404).json({
                           success: false,
                           message: config.messages.user.nonExistentUser,
                           data: error
                       });
                   } else {
                       user_model.oneByUsername(user.username, function(error, doc){
                            if(error){
                                res.status(404).json({
                                    success: false,
                                    message: config.messages.user.nonExistentUser,
                                    data: error
                                });
                            }else{
                                if(doc.passwordLastUpdate){
                                    var salt = doc.password.substr(41,32);
                                    password = common.generatePassword(data.old,salt);
                                }else{
                                    password = sha1(data.old);
                                }
                                if(password != doc.password){
                                    res.status(406).json({
                                        success: false,
                                        message: config.messages.auth.authenticationFailed,
                                        data: {}
                                    });
                                }else{
                                    var newData = {
                                        'password': data.new
                                        , 'passwordLastUpdate': (new Date()).getTime()
                                    };
                                    user_model.update(doc._id, newData
                                        , currentUser, function (error, result) {
                                        if (error) {
                                            res.status(503).json({
                                                success: false,
                                                message: config.messages.general.error_500 + error,
                                                data: {}
                                            });
                                        } else {
                                            log.save(currentUser, 'user','update-password', doc._id, newData, doc, function(error){
                                                if(error){ }else{
                                                    res.json({
                                                        success: true,
                                                        message: config.messages.user.updatedSuccessfully,
                                                        data: {}
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }

                            }
                       });

                   }
                });

            }else {
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
