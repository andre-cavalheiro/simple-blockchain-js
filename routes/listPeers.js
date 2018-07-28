const express = require('express');
const router = express.Router();
const {getPeers} = require('../services/peerServices')

//List known peers
router.get('/', function(req, res, next) {
  const peers = getPeers()
  res.status(201).send(peers.peerAddresses)
});

module.exports = router;
