var db = require('../db');

exports.verify = function (token, cb) {

}

exports.insert = function (user, token, cb) {
    db.get().collection('token')
        .insert({
            id: db.get().collection('token').count()
            , token: token
            , user: user
            , iat: (new Date()).getTime()
            , expires: (new Date()).getTime() + 3600
            , created: (new Date()).getTime()
            , creator: 0
            , modified: (new Date()).getTime()
            , modifier: 0
            , deleted: 0
            , deleter: 0
        }, cb);
}

exports.refresh = function (token, cb) {
    this.one(token, function (error, doc) {
        db.get().collection('token')
            .update({token: token}, doc, cb);
    });
}

exports.one = function (token, cb) {
    db.get().collection('token')
        .findOne({token: token}, cb);
}

exports.delete = function (token, cb) {
    this.one(token, function (error, doc) {
        db.expires = (new Date()).getTime();
        db.get().collection('token')
            .update({token: token}, doc, cb);
    });
}

exports.verify = function(token, cb){
    this.one(token, function (error, doc) {
        if(error){cb(false);}
        else{cb(true);}
    });
}

exports.authenticate = function(username, password, cb){
    db.get().collection('user')
        .findOne({
            username:username,
            password:password,
            active:"1"
        }, cb);
}