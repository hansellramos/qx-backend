var express = require('express');
var token_model = require('../models/token');
var router = express.Router();

router.get('/', function(req, res, next){
    token_model.one('==',function(error, doc){
        console.log(error);
        console.log(doc);
    });
});

module.exports = router;
