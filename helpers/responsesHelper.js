const config = require('../config');

exports.errorGeneral = (res) => {
    return res.status(503).json({
        success: false,
        message: config.messages.general.error_500,
        data: {}
    });
}

exports.errorObjectNotFound = (res, message) => {
    return res.status(404).json({
        success: false,
        message,
        data: {}
    });
}

exports.errorInvalidParameter = (res, message, data = null) => {
    if (data === null) {
        data = {};
    }
    return res.status(406).json({
        success: false,
        message,
        data
    });
}

exports.errorAuthenticationFailed = (res, message = '', data = null) => {
    if (data === null) {
        data = {};
    }
    if (message === '') {
        message = config.messages.auth.authenticationFailed;
    }
    return res.status(406).json({
        success: false,
        message,
        data
    });
}

exports.errorMalformedParameters = (res, message) => {
    return res.status(417).json({
        success: false,
        message,
        data: {}
    });
}

exports.successGeneral = (res, message) => {
    return res.status(200).json({
        success: true,
        message,
        data: {}
    });
}

exports.successCreation = (res, message, result) => {
    return res.status(201).json({
        success: true,
        message,
        data: { result }
    });
}
