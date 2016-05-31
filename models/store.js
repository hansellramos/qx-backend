var db = require('../db');

exports.all = function (cb) {
    var items = [];
    db.get()
        .collection('store').aggregate([
            {
                $lookup: {
                    from: 'subsidiary'
                    , localField: 'subsidiary'
                    , foreignField: 'id'
                    , as: 'subsidiary'
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}