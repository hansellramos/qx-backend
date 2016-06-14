var db = require('../db');

exports.all = function (product, cb) {
    var items = [];
    db.get()
        .collection('record').aggregate([
            {
                $lookup: {
                    from: 'user'
                    , localField: 'user'
                    , foreignField: 'id'
                    , as: 'user'
                }
            }
            , {
                $lookup: {
                    from: 'external'
                    , localField: 'supplier'
                    , foreignField: 'id'
                    , as: 'supplier'
                }
            }
            , {
                $match: {
                    product: product.id
                }
            }
            , {
                $project: {
                    _id: 1,
                    reference: 1,
                    product: 1,
                    analysis_date: 1,
                    elaboration_date: 1,
                    due_date: 1,
                    reception_date: 1,
                    properties: {
                        property: 1,
                        value: 1
                    },
                    user: {
                        _id: 1,
                        id: 1,
                        firstname: 1,
                        lastname: 1
                    },
                    veredict: 1,
                    remission: 1,
                    quantity: 1,
                    existing_quantity: 1,
                    supplier: {
                        name: 1
                    },
                    satisfies: 1,
                    active: 1,
                    clause: 1
                }
            }
        ])
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}

//verify if exists an object with the same reference
exports.exists = function (reference, cb) {
    db.get()
        .collection('record').find(
            { reference: reference }
        ).limit(1)
        .toArray(function (err, docs) {
            cb(err, docs);
        });
}