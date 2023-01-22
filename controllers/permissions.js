const express = require('express');
const permission_model = require('../models/permission');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral} = require('../helpers/responsesHelper');

/* GET permissions listing. */
router.get('/:token', auth, async (req, res) => {
    const permissions = await permission_model.all();
    if (permissions === null) {
        return errorGeneral(res);
    }
    return res.json(permissions);
});

module.exports = router;
