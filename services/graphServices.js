const WebSocket = require("ws")
const mongoose = require('mongoose');
const messageTypes = require('../config/messageTypes')
const {updateChain,verifyBlock} = require('./blockServices')
let nodes = []

//wait for connections
const initP2PServer = function (port) {
    const server = new WebSocket.Server({port});
    server.on('connection', (ws) => handlePear(ws));
    console.log('Waiting for new buddies on: ' + port);
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
    defineMessageHandlers(ws);
    defineErrorHandlers(ws);
}

//Protocol implementation
const defineMessageHandlers = function(ws) {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case messageTypes.sendBlock:
                console.log(message.payload)
                break;
            case messageTypes.requestChain:
                sendChain()
                break;
            case messageTypes.sendChain:
                receiveChain(message.payload)
                break;
        }
    });
};

//Connection error handling
const defineErrorHandlers = function(ws){
    const closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};


//Send block
const sendBlock = function () {
    const blocks = mongoose.model('block')
    blocks.find().sort({index: -1}).limit(1).find(function(err, res) {
        if(err){
            console.log("Err finding block " + err)
        }
        const lastBlock = res[0]._doc
        broadcast(messageTypes.sendBlock, lastBlock)
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
const receiveChain = function (blocks) {
    const searchDepth = 10
    const localBlocks = mongoose.model('block')
    blocks.sort((a, b) => {return a.index - b.index});
    const lastRemoteBlock = blocks[blocks.length - 1]
    localBlocks.find().sort({index: -1}).limit(searchDepth).find(function(err, res) {
        if (err) {
            console.log("Err finding block " + err)
        }
        const localBlocks = res[0]._doc  //fixme
        const lastLocalBlock = localBlocks[0]
        console.log(lastLocalBlock)
        if(lastLocalBlock.index < lastRemoteBlock.index){
            console.log('Local blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
            if(lastRemoteBlock.previousHash === lastLocalBlock.hash && verifyBlock()) {
                console.log('Appending single block to chain')
                createBlock(index, payload, lastHash, hash)
             }else{
                    //fixme - complex stuff
            }
        }
    })
}


//Request the chain from all pears
const queryChain = function () {
    broadcast(messageTypes.requestChain,null);
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
    sendBlock
}