const mongoose = require('mongoose');
const {url, dbName} = require('../config/db')
const firstBlock = require('../config/firstBlock')
const {connectToPears,queryChain} = require('./graphServices')
const {createBlock, verifyBlock} = require('./blockServices')


//Create block model and initiate chain by either creating first block or querying other nodes
const initChain = async function (initialPeers) {

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

    console.log('Emptying db...')
    await emptyChain()

    if(initialPeers.length === 0){
        console.log('Creating genesis block')
        addBlockToChain({payload: firstBlock.payload})
    }
}

const addBlockToChain = async function ({ payload, lastHash, hash, id}){
    const localBlocks = mongoose.model('block')
    let newBlock
    await localBlocks.find().sort({_id: -1}).limit(1).find(async function(err, res) {
        if(err){
            throw new Error('Err looking into chain ' + err)
        }
        if(!payload){
            throw new Error('Can\'t add empty block')
        }
        //If it's the first block in the chain, set previous hash to null
        const lastBlock = (res.length !== 0) ? res[0]._doc : { hash: null}

        newBlock = createBlock(payload ,lastBlock.hash, hash, id)

        await newBlock.save(function (err) {
            if(err){
                throw new Error('Error saving block ' + err)
            }
        })
    });
    return newBlock
}


const emptyChain = async function () {
    const block = mongoose.model('block')
    await block.remove({})

}


const verifyChain = function () {
    return true
}



module.exports = {
    initChain,
    addBlockToChain,
    emptyChain,
    verifyChain
}