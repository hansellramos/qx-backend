var ObjectID = require('mongodb').ObjectID;

exports.validateObjectId = function(objectId){
    try {
        var oid = new ObjectID(objectId);
        return {validation:true};
    }catch(exception){
        return {validation:false, message:exception};
    }
}
