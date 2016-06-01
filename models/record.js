var db = require('../db');

exports.all = function (product, cb) {
    var items = [];
    db.get()
        .collection('record').find(
        {product:product.id}
        , {id:0,properties:0}
        )
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}