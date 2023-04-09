const db = require('../db');
const sha1 = require('sha1');
const config = require('../config');

exports.insert = async (token) => {
    return await db.get().collection('token')
        .insertOne(token);
}

exports.one = async (token) => {
    return await db.get().collection('token')
        .findOne({token: token}, {_id:0});
}

exports.delete = async (token) => {
    const doc = await this.one(token);
    db.expires = (new Date()).getTime();
    return await db.get().collection('token')
        .updateOne({token: token}, {$set: doc});
}

exports.verify = async (token) => {
    return await this.one(token);
}

/**
 * Query token and update expiration time
 * @param token string
 * @returns {Promise<boolean|*>}
 */
exports.refresh = async function (token) {
    const doc = await this.one(token);
    if (!doc) {
        return false;
    }
    doc.expires = (new Date()).getTime()+config.sessionTimelife;
    return await db.get().collection('token')
        .updateOne({token: token}, {$set :doc});
}

exports.authenticate = async (username, password) => {
    const doc = await db.get()
        .collection('user').aggregate([
            {
                $match:{
                    username:new RegExp('^'+username+'$','i'),
                    password:password
                }
            }
        ]).toArray();
    return doc.length > 0 ? doc[0] : null;
}

exports.complete = (token) => {
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

exports.generate = (token) => {
    return sha1(JSON.stringify(token)+"=="+(new Date().getTime()));
}
