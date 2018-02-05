var MongoClient = require('mongodb').MongoClient
var config = require('./config');

var state = {
    db: null,
}

exports.connect = function(url, cb) {
    if (state.db) return cb()

    MongoClient.connect(url, function(err, client) {
        if (err) return cb(err)
        state.db = client.db(config.dbName)
        cb()
    })
}

exports.get = function() {
    return state.db;
}

exports.close = function(done) {
    if (state.db) {
        state.db.close(function(err, result) {
            state.db = null
            state.mode = null
            done(err)
        })
    }
}