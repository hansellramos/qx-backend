const auth_model = require('../models/auth');
const config = require('../config');
const user_model = require("../models/user");

module.exports = async (req, res, next) => {
    let token = req.params.token;
    if (token) {
        const doc = await auth_model.verify(token);
        if (doc) {
            await auth_model.refresh(token);
            // todo: save current user
            req.user = await user_model.oneById(doc.user);
            req.token = doc;
            next();
        } else {
            res.status(404).json({
                success: false,
                message: config.messages.auth.nonExistentToken,
                data: {}
            });
        }
    }
};
