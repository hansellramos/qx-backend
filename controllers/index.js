var express = require('express');
var router = express.Router();
var package = require('../package.json');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      title: 'Qualitrix API'
      , description:package.description
      , version:package.version
      , lastUpdateDate:package.lastUpdateDate
      , release:package.release
      , author:package.author
      , year: 2017
  });
});

module.exports = router;
