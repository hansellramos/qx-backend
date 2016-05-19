var express = require('express');
var db = require('../db');
var router = express.Router();

/* GET subsidiary listing. */
router.get('/', function (req, res, next) {
    db.get()
        .collection('subsidiary').find()
        .toArray(function (err, docs) {
            res.setHeader('Content-Type', 'application/json');
            var items = [];
            docs.forEach(function(item){
                items.push({
                    id:item.id,
                    name:item.name,
                    reference:item.reference
                });
            });
            res.send(JSON.stringify(items));
    });
});

module.exports = router;
