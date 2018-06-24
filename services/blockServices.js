const mongo = require('../db/mongo')
const {calculateHash} = require('./hashServices')
const {collection} = require('../config/db')
const firstBlock = require('../config/firstBlock')
const {insertInDB, getLastElement} = require('../db/mongo')

const initChain = function () {
    insertInDB(firstBlock)
}

const createBlock = function (db, index,lastHash,timestamp, payload){
    const hash = calculateHash(index, lastHash, timestamp, payload)
    return {
        index: index+1,
        hash,
        previousHash: lastHash,
        timestamp,
        payload
    }
}


const addBlockToChain = async function (payload,db){
    const lastBlock = await getLastElement(db)
    const timestamp = new Date().getTime() / 1000;
    const block = createBlock(db, lastBlock.index,lastBlock.hash,timestamp,payload)
    if(!verifyBlock(block, db)){
        throw new Error('Invalid block');
        return
    }

    db.collection(collection).insertOne(block)
    return false
}

const verifyBlock = function () {
    //FIXME
    return true
}


module.exports ={
    initChain,
    createBlock,
    addBlockToChain,
    verifyBlock
}