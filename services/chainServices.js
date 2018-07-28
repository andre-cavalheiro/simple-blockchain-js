const mongoose = require('mongoose');
const firstBlock = require('../config/firstBlock')
const {createBlock} = require('./blockServices')


//Create block model and initiate chain by either creating first block or querying other peers
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

    mongoose.model('block', blockSchema);

    // Emptying previous blocks that were saved in BD before deployment, probably this shouldn't be in production
    console.log('Emptying db...')
    await emptyChain()

    if(initialPeers.length === 0){
        console.log('Creating genesis block')
        addBlockToChain({payload: firstBlock.payload})
    }
}

const addBlockToChain = async function ({ payload, lastHash, hash, id}){
    const localBlocks = mongoose.model('block')
    let newBlock, previousHash
    if(!payload){
        throw new Error('Can\'t add empty block')
    }
    try{
        // Define previous Hash to use
        if(!lastHash){
            await localBlocks.find().sort({_id: -1}).limit(1).find(async function(err, res) {
                // fixme - Sort por id não é o que se pretende mas por enquanto funciona
                if (err) {
                    throw new Error('Err looking into chain ' + err)
                }
                //If it's the first block in the chain, set previous hash to null
                const lastBlock = (res.length !== 0) ? res[0]._doc : {hash: null}
                previousHash = lastBlock.hash
            })
        } else {
            // Verify given previous hash
            await localBlocks.find({hash: lastHash}, async function (err, res) {
                if (err) {
                    throw new Error("Err looking into chain " + err)
                }
                if (res.length === 0 && lastHash !== null) {
                    throw new Error('Missing previous block')
                }
            })
            await localBlocks.find({previousHash: lastHash}, function (err, res) {
                if (!(res.length === 0) && lastHash !== null) {
                    throw new Error('Position is occupied')
                }
            })
            previousHash = lastHash
        }

        newBlock = createBlock(payload, previousHash, hash, id)

        await newBlock.save(function (err) {
            if (err) {
                throw new Error('Error saving block' + err)
            }
        })
        console.log('Block added: ' + newBlock.hash)
        return newBlock
    } catch(err) {
        console.error(err)
        throw err
    }
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