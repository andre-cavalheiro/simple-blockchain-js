const mongoose = require('mongoose');
const {calculateHash} = require('./hashServices')
const firstBlock = require('../config/firstBlock')
const {url, dbName, collection} = require('../config/db')
const {connectToPears,queryChain} = require('./graphServices')

//Create block model and initiate chain by either creating first block or querying other nodes
const initChain = function (mode, initialPeers) {
    mongoose.connect(url + '/' + dbName);

    const Schema = mongoose.Schema,
        ObjectId = Schema.ObjectId;

    const blockSchema = new Schema({
        id: ObjectId,
        index: {type: Number},
        hash: String,
        previousHash: String,
        payload: Object
    });

    /*block.pre('save',function (next) {
        verifyBlock(this)
    })*/

    mongoose.model('block', blockSchema);

    if(mode === 0){
        const firstBlock_ = createBlock(firstBlock.index,firstBlock.payload,firstBlock.previousHash)
        firstBlock_.save(function (err) {
            if(err){
                console.log("Err saving first block " + err)
            }
        })
    }else{
        connectToPears(initialPeers)
        queryChain()
    }
}


const addBlockToChain = function (payload){
    const blocks = mongoose.model('block')
    blocks.find().sort({index: -1}).limit(1).find(function(err, res) {
        if(err){
            console.log("Err finding block " + err)
        }
        const lastBlock = res[0]._doc
        const sendBlock = createBlock(lastBlock.index+1,payload ,lastBlock.hash)
        sendBlock.save(function (err) {
            if(err){
                console.log("Err block " + err)
            }
        })
    });
}


const createBlock = function (index,payload, lastHash, hash){
    const block = mongoose.model('block')
    const instance = new block()
    instance.index = index
    if(hash == undefined){
        instance.hash = calculateHash(index, lastHash, payload)
    } else {
        instance.hash = hash
    }
    instance.previousHash = lastHash
    instance.payload = payload

    return instance
}

const updateChain = function (newChain) {
    if(!verifyChain(newChain)){
        //FIXME
        console.log('Received chain is invalid, aborting...')
        return
    }
    //update chain
}

const verifyChain = function (chain) {
    /*Go through all blocks and verify if:
        Previous Hash matches
        Hash matches content1
    */
    return true
}

const verifyBlock = function () {

}

module.exports ={
    initChain,
    createBlock,
    addBlockToChain,
    updateChain,
    verifyBlock
}