const WebSocket = require("ws")
const mongoose = require('mongoose');
const messageTypes = require('../config/messageTypes')
const {receiveRemoteBlock, sendChain, receiveRemoteChain, sendPeers, queryChain, queryPeers} = require ('./communicationServices')
const {addPeer, dropPeer, getPeers} = require('./peerServices')
const {addBlockToChain} = require('./chainServices')

// You were here! põe isto na DB
// let peers = []
// let peerAddresses = []

//wait for connections
const initP2PServer = function (port) {
    const server = new WebSocket.Server({port});
    server.on('connection', (ws) => {
        handlePear(ws, null)
    })
    console.log('Waiting for new peers connections on: ' + port)
    return server
}

// Connect to every peer in the peers array
const connectToPears = function (newPeers, myInitialConnection) {
    const peers = getPeers()
    newPeers.forEach((peer) => {
        let  ws = new WebSocket(peer);
        ws.on('open', () => {
            handlePear(ws, peer)
            if(myInitialConnection) {
                queryChain(peers.connection)
                queryPeers(peers.connection)
                sendPeers(peers.connection, peers.addresses, peers.connection.length-1)  // depending on the index being the last one is not very secure, should find another way later
            }
        })
        ws.on('error', () => {
            console.log('connection to peer failed')
        })
    })
}

//Whenever a new peer connects, define the protocol
const handlePear = function (ws, address) {
    const peers = getPeers()
    addPeer(ws, address)
    //Define protocol
    defineMessageHandlers(ws, peers.connection.length-1)      // depending on the index being the last one is not very secure, should find another way later
    defineErrorHandlers(ws);
    console.log('Connected to new Peer')
}

//Protocol implementation
const defineMessageHandlers = async function(ws, peerIndex) {
    // fixme peerindex might change if peer is dropped, use unique identifier
    const peers = getPeers()
    ws.on('message', async (data) => {
        const message = JSON.parse(data)
        console.log('Received message ' + data)
        switch (message.type) {
            case messageTypes.sendBlock:
                receiveRemoteBlock(message.payload, peerIndex).catch((err) => {
                    // fixme
                })
                break;
            case messageTypes.requestChain:
                sendChain(peers.connection, peerIndex)
                break;
            case messageTypes.sendChain:
                // receiveRemoteChain(message.payload.chain)
                for(let block of message.payload.chain){
                    // !!! You were here, it's not awaiting
                    await addBlockToChain({id: block._id, hash: block.hash, lastHash: block.previousHash, payload: block.payload}).catch((err) => {
                        if(err.message == 'Position is occupied'){
                            // ignore
                        }else{
                            console.log('boop')
                        }
                    })
                }
                break
            case messageTypes.requestPeers:
                sendPeers(peers.connection, peers.addresses, peerIndex)
                break
            case messageTypes.sendPeers:
                //Receive peers
                let remotePeers = message.payload
                let newPeers = []
                remotePeers.forEach((peer) => {
                    if(!peers.addresses.includes(peer)){
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
    const peers = getPeers()
    const closeConnection = (ws) => {
        console.log('An error occurred, droping peer')
        dropPeer(peers.connection.indexOf(ws))
    };
    ws.on('close', () => closeConnection(ws))
    ws.on('error', () => closeConnection(ws))
}

module.exports = {
    initP2PServer,
    connectToPears
}
