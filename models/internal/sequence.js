var db = require('../../db');

exports.getSequence = async (seqName) => {
    return await db.get()
        .collection('counters').findOneAndUpdate(
            { name: seqName },
            {
                $inc: { seq:1 }
                , $set: { date: (new Date()).getTime() }
            });
}
