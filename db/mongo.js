const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

const getDB = function (callback,params) {
    // Use connect method to connect to the server
    MongoClient.connect(url, function(err, client) {
        console.log((err))
        assert.equal(null, err);
        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const eval = callback(db,params)

        if(eval === undefined){
            return false
        }
    });
    return true
}

const insertDocument = function(db,data) {
    // Get the documents collection
    const collection = db.collection('documents');
    // Insert some documents
    collection.insert([{
        ...data
    }], function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        assert.equal(1, result.ops.length);
        console.log("Inserted a document into the collection");
    });
    return true
}

const getLastDocument = function (db) {

    return {
        index: 0,
        hash: 'thisIsTotallyRandom',
        data: 'Penis'
    }
}


module.exports ={
    getDB,
    insertDocument,
    getLastDocument
}
