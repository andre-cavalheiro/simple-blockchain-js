const mongo = require('../db/mongo')
const hash = require('./hashServices')

const createBlock = function (payload){
    const lastBlock = mongo.getDB(mongo.getLastDocument)
    const timestamp = new Date().getTime() / 1000;
    const hash = hash.hacreateateHash(lastBlock.index, lastBlock.hash, timestamp, timestamp, payload)

    return {index: lastBlock.index+1, hash, payload}
}


const addBlock = function (payload){
    console .log(mongo)
    const block = createBlock(payload)
    const eval = mongo.getDB(mongo.insertDocument,block)
    return eval
}

const verifyBlock = function () {

}


module.exports ={
    createBlock,
    addBlock,
    verifyBlock
}