let peers = {
    connection: [],
    addresses: []
}

const addPeer = function (connection, address) {
    peers.connection.push(connection)
    peers.addresses.push(address)
}

const dropPeer = function (index) {
    peers.connection.splice(index,1)
    peers.addresses.splice(index, 1)
}

const getPeers = function () {
    return peers
}

module.exports = {
    addPeer,
    dropPeer,
    getPeers
}