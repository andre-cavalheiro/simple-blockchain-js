const mongoose = require('mongoose');
const {calculateHash} = require('./hashServices')
const firstBlock = require('../config/firstBlock')
const {url, dbName, collection} = require('../config/db')
const {connectToPears,queryChain} = require('./graphServices')


//Create block model and initiate chain by either creating first block or querying other nodes
const initChain = async function (mode, initialPeers) {
    //Coonect to db
    mongoose.connect(url + '/' + dbName);

    const Schema = mongoose.Schema,
        ObjectId = Schema.ObjectId

    const blockSchema = new Schema({
        _id: {type: ObjectId},
        hash: String,
        previousHash: String,
        payload: Object
    }, {
        versionKey: false
    })

    blockSchema.pre('save', async function (next) {
        const verify = await verifyBlock(this)
        if(verify !== true)
            next(verify)
        else
            next()

    })

    mongoose.model('block', blockSchema);
    if(mode === 0){
        console.log('Emptying db...')
        await emptyChain()
        console.log('Creating genesis block')
        // emptyChain()
        const firstBlock_ = createBlock(firstBlock.payload,firstBlock.previousHash)
        firstBlock_.save(function (err) {
            if(err){
                throw new Error('Couldn\'t save genesis block ' + err)
                //fixme exit
            }
        })
    }else{
        console.log('Connecting to peers...')
        connectToPears(initialPeers)
        console.log('Requesting chain...')
        queryChain()
    }
}


const addBlockToChain = async function ({block, payload}){
    const localBlocks = mongoose.model('block')
    await localBlocks.find().sort({_id: -1}).limit(1).find(async function(err, res) {      //findOne?
        if(err){
            throw new Error('Err looking into chain ' + err)
        }
        const lastBlock = res[0]._doc
        const newBlock =  (block === undefined) ? createBlock(payload ,lastBlock.hash): block

        await newBlock.save(function (err) {
            if(err){
                throw new Error('Error saving block ' + err)
            }
        })
        return newBlock
    });
}


const createBlock = function (payload, lastHash, hash){
    const block = mongoose.model('block')
    const instance = new block()
    instance._id = new mongoose.mongo.ObjectId();
    if(!hash)
        instance.hash = calculateHash(block._id, lastHash, payload)
    else
        instance.hash = hash
    instance.previousHash = lastHash
    instance.payload = payload

    return instance
}


const updateChain = function (newChain) {
    if(!verifyChain(newChain)){
        //fixme
        console.error('Received chain is invalid, aborting...')
        return
    }
    //update chain
}

const verifyBlock = async function (newBlock) {
    //fixme - check if the hash matches the content?
    const block = mongoose.model('block')
    try{
        //fixme - must find a way to sort by hash/previousHash
        await block.find().sort({_id: -1}).limit(1).find(function (err, res) {
            if(err){
                throw new Error("Err looking into chain " + err)
            }
            if(!(res.length == 0)){
                const lastBlock = res[0]._doc
                if(lastBlock.hash !== newBlock.previousHash){
                    throw new Error('Invalid Block, hashes don\'t match')
                }
            }
        })
    } catch(err){
        return err
    }
    return true

}

const verifyChain = function () {
    return true
}


const emptyChain = async function () {
    const block = mongoose.model('block')
    await block.remove({})
    
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
    initChain,
    createBlock,
    addBlockToChain,
    updateChain,
    verifyBlock
}