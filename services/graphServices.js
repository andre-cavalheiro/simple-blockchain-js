const WebSocket = require("ws")
const messageTypes = require('../config/messageTypes')
const {receiveRemoteBlock, sendChain, receiveChain, listKnownPeers} = require ('./communicationServices')

let peers = []

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
        let  ws = new WebSocket(peer);
        ws.on('open', () => handlePear(ws, initialConnection));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
}

//Whenever a new peer connects, define the protocol
const handlePear = function (ws, initialConnection) {
    //Define protocol
    // listKnownPeers()
    peers.push(ws)
    defineMessageHandlers(ws, peers.length -1);
    defineErrorHandlers(ws);
    console.log('-Connected to new peer')
    if(initialConnection){
        queryChain()
    }
}

//Protocol implementation
const defineMessageHandlers = function(ws, peerIndex) {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message ' + JSON.stringify(message));
        switch (message.type) {
            case messageTypes.sendBlock:
                receiveRemoteBlock(message.payload)
                break;
            case messageTypes.requestChain:
                sendChain(peers, peerIndex)
                break;
            case messageTypes.sendChain:
                try{
                    receiveChain(message.payload.chain, message.payload.size) //fixme - use this when it's ready
                } catch(err) {
                    console.log(err)
                    if(err == 'peer-behind'){
                        // peers[peerIndex].send(messageTypes.sendChain, ?? )
                    }
                }
                // receiveRemoteBlock(message.payload.chain[0])
                break;
            case messageTypes.requestPeers:
                listKnownPeers(peers, peerIndex)
                break
            case messageTypes.sendPeers:
                //handle receiving peers, remember to JSON.stringify
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
    peers.forEach(function (peer) {
        peer.send(JSON.stringify({type, payload}))
    })
}


module.exports = {
    initP2PServer,
    connectToPears,
    queryChain,
    broadcast
}
