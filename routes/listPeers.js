const express = require('express');
const router = express.Router();
const {listPeers} = require('../services/graphServices')

//List known peers
router.get('/', function(req, res, next) {
  const peers = listPeers()
  res.status(201).send(peers.peerAddresses)
});

module.exports = router;
