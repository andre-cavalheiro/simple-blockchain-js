const mongoose = require('mongoose');
const {calculateHash} = require('./hashServices')

const createBlock = function (payload, lastHash, hash, id){
    const block = mongoose.model('block')
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


const verifyBlock = async function (newBlock) {
    //fixme - check if the hash matches the content?
    const block = mongoose.model('block')
    try{
        //fixme - must find a way to sort by hash/ previousHash
        await block.find().sort({_id: -1}).limit(1).find(function (err, res) {
            if(err){
                throw new Error("Err looking into chain " + err)
            }
            if(!(res.length == 0)){
                const lastBlock = res[0]._doc
                if(lastBlock.hash !== newBlock.previousHash){
                    console.log('hash (oldBlock): ' + lastBlock.hash + 'pre-hash (newBlock): ' + newBlock.previousHash)
                    throw new Error('Invalid Block, hashes don\'t match')
                }
            }
        })
    } catch(err){
        return err
    }
    return true

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
    verifyBlock,
    countBlocks
}