const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

const state = {
    db: null,
};

exports.connect = async function(url) {
    if (state.db) return state.db;

    try {
        const client = await MongoClient.connect(url, { useNewUrlParser: true });
        state.db = client.db(config.dbName);
        return state.db;
    }
    catch (err) {
        throw err;
    }
}

exports.get = function() {
    return state.db;
}

exports.close = function() {
    if (state.db) {
        try {
            state.db.close();
            state.db = null
            state.mode = null
        } catch (err) {
            throw err;
        }
    }
}
