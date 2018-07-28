const mongoose = require('mongoose');
const {calculateHash} = require('./hashServices')

const createBlock = function (payload, lastHash, hash, id){
    const block = mongoose.model('block')
    if(lastHash === undefined || !payload){
        // fixme
        console.error('Missing parameters for block creation')
        return
    }
    const instance = new block()
    if(!id)
        instance._id = new mongoose.mongo.ObjectId();
    else
        instance._id = id
    if(!hash)
        instance.hash = calculateHash(block._id, lastHash, payload)
    else
        instance.hash = hash

    instance.previousHash = lastHash
    instance.payload = payload

    return instance
}


const countBlocks = function () {
    const block = mongoose.model('block')
    let numBlocks = false
    block.count({}, function(err, count) {
        numBlocks = count
    });
    return numBlocks
}


module.exports ={
    createBlock,
    countBlocks
}