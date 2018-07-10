const WebSocket = require("ws")
const mongoose = require('mongoose');
const messageTypes = require('../config/messageTypes')
const {createBlock, updateChain,verifyBlock} = require('./blockServices')
let nodes = []

//wait for connections
const initP2PServer = function (port) {
    const server = new WebSocket.Server({port});
    server.on('connection', (ws) => {
        handlePear(ws)
    });
    console.log('Waiting for new peers connections on: ' + port);
    return server
}

//Initial connection
const connectToPears = function (peers) {
    peers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => handlePear(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
}

//Whenever a new peer connects, define the protocol
const handlePear = function (ws) {
    nodes.push(ws)
    //Define protocol
    // listKnownPeers()
    defineMessageHandlers(ws, nodes.length -1);
    defineErrorHandlers(ws);
    console.log('-Connected to new peer')
}

//Protocol implementation
const defineMessageHandlers = function(ws, peerIndex) {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case messageTypes.sendBlock:
                console.log(message.payload)
                receiveRemoteBlock(message.payload, peerIndex)
                break;
            case messageTypes.requestChain:
                sendChain()
                break;
            case messageTypes.sendChain:
                receiveChain(message.payload)
                break;
            case messageTypes.requestPeers:
                listKnownPeers(peerIndex)
                break
            case messageTypes.sendPeers:
                //handle receiving peers
                break
        }
    });
};

//Receive new remote block and add it to the chain
const receiveRemoteBlock = function (remoteBlock, peerIndex) {
    if(!verifyBlock(remoteBlock)){
        queryChain()
        return
    }
    const newBlock = createBlock(remoteBlock.payload, remoteBlock.lastHash, remoteBlock.hash)
    addBlockToChain({block: newBlock})
}

//Connection error handling
const defineErrorHandlers = function(ws){
    const closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};


// Spread the new received block to every other node that's not the one who send the new block
const spreadNewBlock = function (payload) {
    nodes.forEach(function (ws, key) {
        sendBlock(ws,key,payload)
    })
}



//Send block
const sendBlock = function (ws, index, payload) {
    const blocks = mongoose.model('block')
    blocks.find().sort({_id: -1}).limit(1).find(function(err, res) {
        if(err){
            console.log("Err finding block " + err)
        }
        const lastBlock = res[0]._doc
        nodes[index].send(JSON.stringify({type: messageTypes.sendBlock, payload}))
    });
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
            console.log('Local blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
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


//Request the chain from all pears
const queryChain = function () {
    broadcast(messageTypes.requestChain,null);
}

const listKnownPeers = function (peerIndex) {
    nodes[peerIndex].send({
        type: messageTypes.sendPeers,
        payload: nodes
    })
}

//Send payload to known pears
const broadcast = function (type, payload) {
    nodes.forEach(function (peer) {
        peer.send(JSON.stringify({type, payload}))
    })
}


module.exports = {
    initP2PServer,
    connectToPears,
    queryChain,
    spreadNewBlock
}