const WebSocket = require("ws")
const mongoose = require('mongoose');
const messageTypes = require('../config/messageTypes')
let nodes = []


const initP2PServer = function (port) {
    const server = new WebSocket.Server({port});
    server.on('connection', (ws) => handlePear(ws));
    console.log('Waiting for new buddies on: ' + port);
    return server
}

const handlePear = function (ws) {
    nodes.push(ws)
    //Define protocol
    messageHandlers(ws);
    errorHandlers(ws);
}

const messageHandlers = function(ws) {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case messageTypes.newBlock:
                console.log(message.block)
                break;

        }
    });
};

const errorHandlers = function(ws){
    const closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

const connectToPears = function (peers) {
    peers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => handlePear(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
}

const listPeers = function () {
    return []
}

const sendBlock = function () {
    const blocks = mongoose.model('block')
    blocks.find().sort({index: -1}).limit(1).find(function(err, res) {
        if(err){
            console.log("Err finding block " + err)
        }
        const lastBlock = res[0]._doc
        nodes.forEach(function (peer) {
            peer.send(JSON.stringify({type: messageTypes.newBlock, block: lastBlock}))
        })
    });
}

module.exports = {
    initP2PServer,
    listPeers,
    handlePear,
    connectToPears,
    sendBlock
}