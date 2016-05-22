var db = require('../db');
var sha1 = require('sha1');

exports.insert = function (token, cb) {
    db.get().collection('token')
        .insert(token, cb);
}

exports.one = function (token, cb) {
    db.get().collection('token')
        .findOne({token: token},{_id:0}, function(error, doc){
            cb(error, doc);
        });
}

exports.delete = function (token, cb) {
    this.one(token, function (error, doc) {
        db.expires = (new Date()).getTime();
        db.get().collection('token')
            .update({token: token}, doc, cb);
    });
}

exports.verify = function (token, cb) {
    this.one(token, function(error, doc){
        if(error){cb(false)}
        else{
            if(doc){
                cb(doc);
            }else{
                cb(false);
            }
        }
    });
}

exports.refresh = function (token, cb) {
    this.one(token, function (error, doc) {
        db.get().collection('token')
            .update({token: token}, doc, cb);
    });
}

exports.authenticate = function(username, password, cb){
    db.get().collection('user')
        .findOne({
            username:username,
            password:password,
            active:true
        }, cb);
}

exports.complete = function(token){
    if(!token.user){ return null; }
    if(!token.iat){ return null; }
    if(!token.expires){ return null; }
    if(!token.created){ token.created = (new Date()).getTime(); }
    if(!token.creator){ token.creator = 0; }
    if(!token.modified){ token.modified = (new Date()).getTime(); }
    if(!token.modifier){ token.modifier = 0; }
    if(!token.id){
        if(!token.deleted){ token.deleted = false; }
        if(!token.deleter){ token.deleter = false; }
    }
    return token;
}

exports.generate = function(token){
    return sha1(JSON.stringify(token));
}