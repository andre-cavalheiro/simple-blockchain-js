const WebSocket = require("ws");
let nodes = []


const initP2PServer = function (port) {
    /*const server = new WebSocket.Server({port});
    server.on('connection', (ws) => connectToPear(ws));
    console.log('Waiting for new buddies on: ' + port);
    return server*/
    return true
}

const connectToPear = function (ws) {
    nodes.push(ws)
    ws.on('message', (block) => {

    })
}

const listPeers = function () {
    return []
}

const sendChain = function () {
    return true
}

module.exports = {
    initP2PServer,
    listPeers,
    connectToPear,
    sendChain
}