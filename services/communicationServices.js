const mongoose = require('mongoose');
const {addBlockToChain} = require('./chainServices')
const {createBlock, verifyBlock} = require('./blockServices')


//Receive new remote block and add it to the chain
const receiveRemoteBlock = function (remoteBlock, peerIndex) {
    if(!verifyBlock(remoteBlock)){
        queryChain()
        return
    }
    const newBlock = createBlock(remoteBlock.payload, remoteBlock.lastHash, remoteBlock.hash)
    addBlockToChain({block: newBlock})
}

//Send entire chain
const sendChain = function () {
    const blocks = mongoose.model('block')
    blocks.find(function(err, res) {
        if(err){
            console.log("Err finding block " + err)
        }
        const chain = res.map((n) => { return n._doc })
        broadcast(messageTypes.sendChain, chain)
    });
}

//Receive chain and act accordingly
const receiveChain = function (remoteBlocks) {
    //fixme - this should receive as a parameter the number of elements in the chain with countBlock() and searching a constant number of elements for eventual cheching (maybe rework?)
    //FIX THIS FUNCTION
    const searchDepth = 10
    const localBlocks = mongoose.model('block')
    if(localBlocks == undefined){
        //fill empty library
        for(let i = 0; i< remoteBlocks.length; i++){
            //fixme - test-me
            let nextChainBlock = remoteBlocks[remoteBlocks.length - i]
            createBlock(nextChainBlock.payload, nextChainBlock.previousHash, nextChainBlock.hash)
        }
        return
    }
    remoteBlocks.sort((a, b) => {return a.index - b.index});
    const lastRemoteBlock = remoteBlocks[remoteBlocks.length - 1]
    localBlocks.find().sort({_id: -1}).limit(searchDepth).find(function(err, res) {
        if (err) {
            //fixme
            console.log("Err finding block " + err)
        }
        const localBlocks = res[0]._doc  //fixme
        const lastLocalBlock = localBlocks[0]
        if(lastLocalBlock.index < lastRemoteBlock.index){
            console.log('Local blockchain possibly behind. We got: ' + latestBlockHeld.hash + ' Peer got: ' + latestBlockReceived.previousHash);
            if(lastRemoteBlock.previousHash === lastLocalBlock.hash) {
                console.log('Appending single block to chain')
                addBlockToChain({block: lastRemoteBlock})
                return
            }else{
                //search local chain to see if it matches up
                //search for a few lost nodes
                //fixme - test-me
                let fixedChain = false
                for(let i = 0; i< remoteBlocks.length; i++){
                    if(remoteBlocks[remoteBlocks.length - i].previousHash == lastRemoteBlock.hash) {
                        for (let j = remoteBlocks.length - i; j >= 0; j--){
                            let nextChainBlock = remoteBlocks[remoteBlocks.length - j]
                            addBlockToChain({block: nextChainBlock})
                            if(j == 0){
                                fixedChain = true
                            }
                        }
                        break;
                    }
                }
                //search for forks in the chain
                if(!fixedChain){
                    //fixme - algorithm to find where branch is broken and check which one is longer
                }
            }
        }
    })
}


//List Known Peers to single nodes who have requested them
const listKnownPeers = function (nodes, peerIndex) {
    nodes[peerIndex].send({
        type: messageTypes.sendPeers,
        payload: nodes
    })
}

module.exports = {
    receiveRemoteBlock,
    sendChain,
    receiveChain,
    listKnownPeers
}
