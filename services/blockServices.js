const {calculateHash} = require('./hashServices')
const firstBlock = require('../config/firstBlock')
const {url, dbName, collection} = require('../config/db')
const mongoose = require('mongoose');

const initChain = function (mode) {
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
        const firstBlock_ = createBlock(firstBlock.index,firstBlock.previousHash,firstBlock.payload)
        firstBlock_.save(function (err) {
            if(err){
                console.log("Err saving first block " + err)
            }
        })
    }else{
        //GET dava from other nodes
    }
}


const addBlockToChain = async function (payload){
    const blocks = mongoose.model('block')
    blocks.find().sort({index: -1}).limit(1).find(function(err, res) {
        if(err){
            console.log("Err finding block " + err)
        }
        const lastBlock = res[0]._doc
        const newBlock = createBlock(lastBlock.index+1,lastBlock.hash,payload)
        newBlock.save(function (err) {
            if(err){
                console.log("Err block " + err)
            }
        })
    });
}


const createBlock = function (index,lastHash, payload){
    const block = mongoose.model('block')
    const instance = new block()
    instance.index = index
    instance.hash = calculateHash(index, lastHash, payload)
    instance.previousHash = lastHash
    instance.payload = payload

    return instance
}


module.exports ={
    initChain,
    createBlock,
    addBlockToChain,
}