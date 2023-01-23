const express = require('express');
const certificate_model = require('../models/certificate');
const record_model = require('../models/record');
const config = require('../config');
const common = require('../common');
const log = require('../models/internal/log');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorGeneral, errorMalformedParameters, errorObjectNotFound, successGeneral} = require("../helpers/responsesHelper");

/* GET certificates listing. */
router.get('/:token', auth, async (req, res) => {
    const from = req.query.all ? 0 : new Date().getTime() - (188*24*3600*1000);
    const certificates = await certificate_model.all(from);
    if (certificates == null) {
        return errorGeneral(res);
    }
    return res.json(certificates);
});

/* GET one certificate. No auth required */
router.get('/-/:certificate', async (req, res) => {
    const certificate = await certificate_model.one(req.params.certificate);
    if (certificate === null) {
        return errorGeneral(res);
    }
    if(certificate === false){
        return errorObjectNotFound(res, config.messages.certificate.nonExistentCertificate);
    }
    return res.json(certificate);
});

/* GET Validate Certificate. No auth required */
router.get('/validate/:id/:validation', async (req, res) => {
    const certificate = await certificate_model.validate(req.params.id, req.params.validation);
    if (certificate === null) {
        return errorGeneral(res);
    }
    if (certificate === false) {
        return errorObjectNotFound(res, config.messages.certificate.nonExistentCertificate);
    }
    return res.json(certificate);
});

/* POST certificates creation. */
router.post('/:token', auth, async (req, res) => {
    const data = req.body;
    const result = await certificate_model.add(data, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    const lastInsertedId = await certificate_model.lastInsertedId();
    await log.save(req.user.id, 'certificate','add', lastInsertedId._id, data,[]);
    await updateRecords(data.records, 0, result.id, req.user.id, () => {
        return successGeneral(res, config.messages.certificate.addedSuccessfully, lastInsertedId)
    });
});

/* Using recursion to update records */
const updateRecords = async (records, index, certificate, user, cb) => {
    if(index >= records.length){
        cb();
    }else{
        const record = await record_model.one(records[index]._id);
        if (record === null) {
            return cb();
        }
        let c = [];
        if(typeof record.certificates !== 'undefined'){
            c = record.certificates;
        }
        c.push({
            'id': certificate
            , quantity: records[index].quantity
        });
        const data = {
            'certificates': c
            , 'existing_quantity': record.existing_quantity - records[index].quantity
        };
        await record_model.update(record._id, data, user);
        await updateRecords(records, index + 1, certificate, user, cb);
    }
}

/* DELETE certificate elimination. */
router.delete('/:token/:certificate', auth, async (req, res) => {
    const certificateParamValidation = common.validateObjectId(req.params.certificate);
    if(!certificateParamValidation.validation){
        return errorMalformedParameters(res, `${config.messages.certificate.paramCertificateInvalid} ${certificateParamValidation.message}`);
    }
    const certificate = await certificate_model.one(req.params.certificate);
    if (certificate === null) {
        return errorGeneral(res);
    }
    if(certificate === false){
        return errorObjectNotFound(res, config.messages.certificate.nonExistentCertificate);
    }

    const result = await certificate_model.delete(req.params.certificate, req.user.id);
    if (result === null) {
        return errorGeneral(res);
    }
    await log.save(req.user.id, 'certificate','delete', req.params.certificate, [], certificate);
    return successGeneral(res, config.messages.certificate.deletedSuccessfully);
});

module.exports = router;
