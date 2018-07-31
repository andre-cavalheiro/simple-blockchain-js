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

const addBlockToChain = async function ({ payload, lastHash, hash, id}) {
    const localBlocks = mongoose.model('block')
    let newBlock, previousHash
    if (!payload) {
        throw new Error('Can\'t add empty block')
    }
    try {
        // Define previous Hash to use
        if (lastHash === undefined) {
            await localBlocks.find().sort({_id: -1}).limit(1).find().then( res => {
                // fixme - Sort por id não é o que se pretende mas por enquanto funciona
                //If it's the first block in the chain, set previous hash to null
                const lastBlock = (res.length !== 0) ? res[0]._doc : {hash: null}
                previousHash = lastBlock.hash
            }).catch(err => {throw new Error(err)})
        } else if (lastHash === null) {
            // If it's the genesis block check if we have it
           await localBlocks.find({_id: id}).then( res => {
                if (res.length === 0) {
                    previousHash = lastHash
                }
                else {
                    throw new Error('Position is occupied')
                }
            }).catch(err => {throw err})
        } else {
            // Verify given previous hash
            await localBlocks.find({hash: lastHash}).then( res => {
                if (res.length === 0) {
                    throw new Error('Missing previous block')
                }
            }).then( () => {
                return localBlocks.find({previousHash: lastHash})
            }).then( res => {
                if (!(res.length === 0)) {
                    throw new Error('Position is occupied')
                }
            }).catch(err => {throw err})

            previousHash = lastHash
        }

        newBlock = createBlock(payload, previousHash, hash, id)

        await newBlock.save().catch((err) => {
            console.log('Error saving Block ' + err)
        })
        console.log('Block added: ' + newBlock.hash + '\n')
        return newBlock
    } catch(err){
        throw err
    }
}


const emptyChain = async function () {
    const block = mongoose.model('block')
    await block.remove({})

}


const getLastHashInChain = async function () {
    let lastHash
    await localBlocks.find().sort({_id: -1}).limit(1).find(async function (err, res) {
        // fixme - Sort por id não é o que se pretende mas por enquanto funciona
        if (err) {
            throw new Error('Err looking into chain ' + err)
        }
        //If it's the first block in the chain, set previous hash to null
        lastHash = (res.length !== 0) ? res[0]._doc.hash : null
    })
    return lastHash
}


module.exports = {
    initChain,
    addBlockToChain,
    getLastHashInChain
}