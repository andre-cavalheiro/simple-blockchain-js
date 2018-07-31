const mongoose = require('mongoose');
const messageTypes = require('../config/messageTypes')
const {addBlockToChain, getLastHashInChain} = require('./chainServices')
const {countBlocks} = require('./blockServices')
const {getPeers} = require('./peerServices')

//Receive new remote block and add it to the chain
const receiveRemoteBlock = async function (remoteBlock, exception) {
    await addBlockToChain({id: remoteBlock._id, hash: remoteBlock.hash, lastHash: remoteBlock.previousHash, payload: remoteBlock.payload}).then((newBlock) => {
        spreadNewBlock(newBlock, exception)
    } ).catch( (err) => {
        if(err.message == 'Position is occupied'){
            console.log('> Ignored Block')
            return
        }
        throw err
    })

}

//Send entire chain
const sendChain = function (peers, peerIndex) {
    const blocks = mongoose.model('block')
    blocks.find({}, function(err, res) {
        if(err){
            console.log("Err finding block " + err)
        }
        const chain = res.map((n) => { return n._doc })
        let payload = {
            chain: [],
            size: countBlocks()
        }
        if(!Array.isArray(chain)){
            payload.chain.push(chain)
        }else{
            payload.chain = chain
        }
        peers[peerIndex].send( JSON.stringify({
            type: messageTypes.sendChain,
            payload
            })
        )
    })
}

//List Known Peers to single peers who have requested them
const sendPeers = function (peers, peerAddresses, peerIndex) {
    // fixme - i need better testing (but appear to be working :) )
    let payload = (peerAddresses.length !== 0) ? peerAddresses.slice() : []     // Slice is necessary to copy the array, so splice won't change the original peerAdresses
    payload.splice(peerIndex, 1)    // Do not send the peers' address to himself
    peers[peerIndex].send(JSON.stringify({
        type: messageTypes.sendPeers,
        payload
    }))
}

//Receive chain and act accordingly
const receiveRemoteChain = function (chain) {
    const lastRemoteHash = getLastHashInChain()
    chain.find
}

//Request the chain from all pears
const queryChain = function () {
    broadcast(messageTypes.requestChain,null);
}

//Request the chain from all pears
const queryPeers = function () {
    broadcast(messageTypes.requestPeers,null);
}

const spreadNewBlock = function(block, exception){
    broadcast(messageTypes.sendBlock, block, exception)
}

//Send payload to known pears
const broadcast = function (type, payload, exception) {
    const peers = getPeers()
    peers.connection.forEach(function (peer, index) {
        if(!(index === exception)){
            peer.send(JSON.stringify({type, payload}))
        }
    })
}


module.exports = {
    receiveRemoteBlock,
    sendChain,
    sendPeers,
    receiveRemoteChain,
    queryChain,
    queryPeers,
    spreadNewBlock,
    broadcast
}
