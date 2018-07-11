const WebSocket = require("ws")
const messageTypes = require('../config/messageTypes')
const {receiveRemoteBlock, sendChain, receiveChain, listKnownPeers} = require ('./communicationServices')

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
const connectToPears = function (peers, initialConnection) {
    peers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => handlePear(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
    if(initialConnection){
        queryChain()
    }
}

//Whenever a new peer connects, define the protocol
const handlePear = async function (ws) {
    nodes.push(ws)
    //Define protocol
    // listKnownPeers()
    await defineMessageHandlers(ws, nodes.length -1);
    await defineErrorHandlers(ws);
    console.log('-Connected to new peer')
}

//Protocol implementation
const defineMessageHandlers = function(ws, peerIndex) {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message ' + JSON.stringify(message));
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
                listKnownPeers(nodes, peerIndex)
                break
            case messageTypes.sendPeers:
                //handle receiving peers
                break
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
    broadcast
}
