var db = require('../db');

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('product').aggregate([
            {
                $lookup: {
                    from: 'store'
                    , localField: 'store'
                    , foreignField: 'id'
                    , as: 'store'
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}