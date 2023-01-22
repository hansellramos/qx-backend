const express = require('express');
const router = express.Router();
const package = require('../package.json');

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', {
      title: 'Qualitrix API - PQP'
      , description:package.description
      , version:package.version
      , lastUpdateDate:package.lastUpdateDate
      , release:package.release
      , author:package.author
      , year: 2023
  });
});

module.exports = router;
