const db = require('../db');

exports.all = async function () {
    return await db.get()
        .collection('permission')
        .aggregate([])
        .toArray();
}
