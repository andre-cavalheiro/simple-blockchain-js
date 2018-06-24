const mongoose = require('mongoose');

// Database configuration parameters
const {url, dbName, collection} = require('../config/db')

const initDB = function () {
    mongoose.connect(url + '/' + dbName);

    const blockSchema = new Schema({
        id: ObjectId,
        hash: String,
        previousHash: String,
        payload: Object
    });

    /*block.pre('save',function (next) {
        verifyBlock(this)
    })*/

    const block = mongoose.model('block', blockSchema);

}

const insertInDB = function (payload) {
    // Use connect method to connect to the server
    const newBlock = mongoose.model('block');
}

const getLastElement = async function (db) {
    const numElements = await db.collection(collection).count()
    const results = db.collection(collection)
    console.log(results)
    return results
}

module.exports = {
    insertInDB,
    getLastElement
}
