const WebSocket = require("ws")
const messageTypes = require('../config/messageTypes')
const {receiveRemoteBlock, sendChain, receiveChain, sendPeers} = require ('./communicationServices')

let peers = []
let peerAddresses = []

//wait for connections
const initP2PServer = function (port) {
    const server = new WebSocket.Server({port});
    server.on('connection', (ws) => {
        handlePear(ws)
    })
    console.log('Waiting for new peers connections on: ' + port)
    return server
}

//Connection
const connectToPears = function (peers, initialConnection) {
    peers.forEach((peer) => {
        let  ws = new WebSocket(peer);
        ws.on('open', () => {
            peerAddresses.push(peer)
            handlePear(ws, initialConnection)
        })
        ws.on('error', () => {
            console.log('connection to peer failed')
        })
    })
}

//Whenever a new peer connects, define the protocol
const handlePear = function (ws, myInitialConnection) {
    //Define protocol
    peers.push(ws)
    defineMessageHandlers(ws, peers.length -1)      // depending on the index being the last one is not very secure, should find another way later
    defineErrorHandlers(ws);
    console.log('-Connected to new peer')
    if(myInitialConnection){
        queryChain()
        queryPeers()
        sendPeers(peers, peerAddresses, peers.length -1) // depending on the index being the last one is not very secure, should find another way later
    }
}

//Protocol implementation
const defineMessageHandlers = async function(ws, peerIndex) {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message ' + JSON.stringify(message));
        switch (message.type) {
            case messageTypes.sendBlock:
                    receiveRemoteBlock(message.payload).then((newBlock) => {
                    broadcast(messageTypes.sendBlock, newBlock, peerIndex)
                })
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
                sendPeers(peers, peerAddresses, peerIndex)
                break
            case messageTypes.sendPeers:
                let remotePeers = message.payload
                let newPeers = []
                remotePeers.forEach(peer => {
                    if(!peerAddresses.includes(peer)){
                        newPeers.push(peer)
                    }
                })
                connectToPears(newPeers)
                break
        }
    });
};


//Connection error handling
const defineErrorHandlers = function(ws){
    const closeConnection = (ws) => {
        console.log('An error occurred, droping peer');
        peers.splice(peers.indexOf(ws), 1)
        peerAddresses.splice(peers.indexOf(ws), 1)
    };
    ws.on('close', () => closeConnection(ws))
    ws.on('error', () => closeConnection(ws))
}


//Request the chain from all pears
const queryChain = function () {
    broadcast(messageTypes.requestChain,null);
}

//Request the chain from all pears
const queryPeers = function () {
    broadcast(messageTypes.requestPeers,null);
}


//Send payload to known pears
const broadcast = function (type, payload, exeption) {
    peers.forEach(function (peer) {
        if(!(peer === exeption)){
            peer.send(JSON.stringify({type, payload}))
        }
    })
}

const listPeers = function () {
    return {
        peers,
        peerAddresses
    }
}

module.exports = {
    initP2PServer,
    connectToPears,
    queryChain,
    queryPeers,
    broadcast,
    listPeers
}
