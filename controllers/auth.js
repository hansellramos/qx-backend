const express = require('express');
const config = require('../config');
const log = require('../models/internal/log');
const auth_model = require('../models/auth');
const user_model = require('../models/user');
const sha1 = require('sha1');
const router = express.Router();
const common = require('../common');
const auth = require('../middleware/auth');
const {errorGeneral} = require("../helpers/responsesHelper");

router.post('/login', async (req, res) => {
    let doc = await user_model.oneByUsername(req.body.username);
    if (!doc) {
        await log.save(req.body.username, 'auth','loginFailed', '', [], []);
        return res.status(404).json({
            success: false,
            message: config.messages.auth.usernameNotFound,
            data: {}
        });
    }

    // this is for update old style password
    let password;
    if(doc.passwordLastUpdate){
        const salt = doc.password.substring(41, doc.password.length -2);
        password = common.generatePassword(req.body.password,salt);
    }else{
        password = sha1(req.body.password);
    }

    doc = await auth_model.authenticate(req.body.username, password);
    if (!doc) {
        await log.save(req.body.username, 'auth','loginFailed', '', [], []);
        return res.status(401).json({
            success: false,
            message: config.messages.auth.authenticationFailed,
            data: {}
        });
    }

    const token = {
        user: doc.id
        , iat: (new Date()).getTime()
        , expires: (new Date()).getTime() + config.sessionTimelife
    };
    token.token = auth_model.generate(auth_model.complete(token));
    const tokenDocument = await auth_model.insert(token);
    if (!tokenDocument) {
        return errorGeneral(res);
    }
    await log.save(token.user, 'auth', 'login', token.token, token, []);
    return res.json({
        success: true,
        message: config.messages.auth.successfulLogin,
        data: {
            token: token.token
        }
    });
});

router.get('/:token', auth, async(req, res) => {
    const token = req.token;
    token.user = req.user;
    return res.json({
        success:true,
        message:'',
        data:{
            token: req.token
        }
    });
});

router.delete('/:token', auth, async (req, res) => {
    await auth_model.delete(req.token.token);
    await log.save(req.token.user, 'auth','logout', req.token.token, [], req.token.token);
    return res.json({
        success: true,
        message: config.messages.auth.endedTokenSuccessfully,
        data: {}
    });
});

module.exports = router;
