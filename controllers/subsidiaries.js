var express = require('express');
var subsidiary_model = require('../models/subsidiary');
var router = express.Router();

/* GET subsidiary listing. */
router.get('/', function (req, res, next) {
    subsidiary_model.all(function(error, result){
        if(error){}
        else {
            res.json(result);
        }
    });
});

module.exports = router;
