const MongoClient = require('mongodb').MongoClient;

// Database configuration parameters
const {url, dbName, collection} = require('../config/db')

const insertInDB = function (payload) {
    // Use connect method to connect to the server
    MongoClient.connect(url, function(err, client) {
        if(!err){
            console.log("Connected successfully to server");
        }

        const db = client.db(dbName);
        db.collection(collection).insert({...payload})
    });
    return true
}

const getLastElement = async function (db) {db.collection(collection).find()
    const results = await db.collection(collection).findOne({$query: {}, $orderby: {$natural : -1}})
    return results
}

module.exports = {
    insertInDB,
    getLastElement
}
