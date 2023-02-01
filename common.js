var ObjectID = require('mongodb').ObjectID;
var config = require('./config');
var sha1 = require('sha1');

exports.validateObjectId = function(objectId){
    try {
        new ObjectID(objectId);
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
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < len; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

exports.generatePassword = function(password, salt){
    return sha1(config.secret+password+salt)+":"+salt+"==";
}
