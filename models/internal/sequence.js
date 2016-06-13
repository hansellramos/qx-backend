var db = require('../../db');

exports.getSequence = function (seqName, cb) {
    db.get()
        .collection('counters').findOneAndUpdate(
            { name: seqName },
            {
                $inc: { seq:1 }
                , $set: { date: (new Date()).getTime() }
            }
            , function(error, result){
                cb(error, result);
            }
        );
}