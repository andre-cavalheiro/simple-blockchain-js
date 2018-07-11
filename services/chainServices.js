const mongoose = require('mongoose');
const {url, dbName} = require('../config/db')
const firstBlock = require('../config/firstBlock')
const {connectToPears,queryChain} = require('./graphServices')
const {createBlock, verifyBlock} = require('./blockServices')


//Create block model and initiate chain by either creating first block or querying other nodes
const initChain = async function (firstNode, initialPeers) {
    //Connect to db
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
    if(firstNode){
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