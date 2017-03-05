var ObjectID = require('mongodb').ObjectID;

exports.validateObjectId = function(objectId){
    try {
        var oid = new ObjectID(objectId);
        return {validation:true};
    }catch(exception){
        return {validation:false, message:exception};
    }
}

exports.makeSalt = function(len){
    if(typeof len == 'undefined'){
        len = 32;
    }
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789|!¡$%()¿*";
    for( var i=0; i < len; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
