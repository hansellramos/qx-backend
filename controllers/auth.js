var express = require('express');
var auth_model = require('../models/auth');
var sha1 = require('sha1');
var router = express.Router();

router.post('/', function(req, res, next){
    auth_model.authenticate(req.body.username, sha1(req.body.password), function(error, doc){
        if(error){ cb(error);
        }else{
            if(doc){
                console.log("auth");
            }else{
                console.log("invalid username and password");
            }
        }
    })
});

module.exports = router;
