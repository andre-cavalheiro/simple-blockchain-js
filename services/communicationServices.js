const mongoose = require('mongoose');
const messageTypes = require('../config/messageTypes')
const {addBlockToChain} = require('./chainServices')
const {countBlocks} = require('./blockServices')


//Receive new remote block and add it to the chain
const receiveRemoteBlock = async function (remoteBlock) {
    const newBlock = await addBlockToChain({id: remoteBlock._id, hash: remoteBlock.hash, previousHash: remoteBlock.previousHash, payload: remoteBlock.payload})
    return newBlock
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
    const payload = (peerAddresses.length !== 0) ? peerAddresses: []
    payload.slice(peerIndex, 1)
    peers[peerIndex].send(JSON.stringify({
        type: messageTypes.sendPeers,
        payload
    }))
}

//Receive chain and act accordingly
const receiveChain = function (remoteBlocks, remoteChainSize) {
    // fixme - this should receive as a parameter the number of elements in the chain with countBlock() and searching a constant number of elements for eventual cheching (maybe rework?)
    const searchDepth = 10
    const localBlocks = mongoose.model('block')
    const localChainSize = countBlocks()

    //We assume the chain was send with sort{_id:-1}
    const lastRemoteBlock = remoteBlocks[0]

    if(remoteChainSize < localChainSize){
        console.log('Peer possibly behind, sending chain...')
        throw new Error('peer-behind')
    }

    localBlocks.find().sort({_id: -1}).limit(searchDepth).find(function(err, res) {
        if (err) {
            // fixme
            console.log("Err finding block " + err)
        }
        if(res.length == 0){
            console.log('Receiving entire chain')
            remoteBlocks.forEach(block =>{
                addBlockToChain({id: block._id, payload: block.payload, lastHash: block.lastHash, hash: block.hash})
            })
            return
        }
        const localBlocks = res[0]._doc
        const lastLocalBlock = localBlocks[0]

        // Begin to check differences between chains:
        console.log('Local blockchain possibly behind. We got: ' + latestBlockHeld.hash + ' Peer got: ' + latestBlockReceived.previousHash);
        if(lastRemoteBlock.previousHash === lastLocalBlock.hash) {
            console.log('Appending single block to chain')
            addBlockToChain({block: lastRemoteBlock})
            return
        }else{
            let fixedChain = false
            for(let i = 0; i< remoteBlocks.length; i++){
                if(remoteBlocks[remoteBlocks.length - i].previousHash == lastRemoteBlock.hash) {
                    for (let j = remoteBlocks.length - i; j >= 0; j--){
                        let nextChainBlock = remoteBlocks[remoteBlocks.length - j]
                        addBlockToChain({id: nextChainBlock._id, payload: nextChainBlock.payload, lastHash: nextChainBlock.lastHash, hash: nextChainBlock.hash})
                        if(j == 0){
                            fixedChain = true
                        }
                    }
                    break;
                }
            }
            if(!fixedChain){
                //search for forks in the chain?
                throw new Error("unmaching-chains")
            }
        }

    })
}


module.exports = {
    receiveRemoteBlock,
    sendChain,
    sendPeers,
    receiveChain
}
