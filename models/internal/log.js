const db = require('../../db');

exports.save = async (user, module, action, key, newData, oldData) => {
    oldData = reduce(oldData);
    return await db.get()
        .collection('log')
        .insertOne({
                date: new Date()
                , user:user
                , module:module
                , action:action
                , key:key
                , newData:newData
                , oldData:oldData
            });
}

const reduce = (data) => {
    if(data.creator && data.creator.length>0){
        data.creator = data.creator[0].id
    }
    if(data.modifier && data.modifier.length>0){
        data.modifier = data.modifier[0].id
    }
    if(data.deleter && data.deleter.length>0){
        data.deleter = data.deleter[0].id
    }
    return data;
}
