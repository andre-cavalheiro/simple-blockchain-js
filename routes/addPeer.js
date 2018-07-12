const express = require('express');
const router = express.Router();
const graph =require('../services/graphServices')

//List known peers
router.post('/', function(req, res, next) {
  //fixme
  res.send('respond with a resource');
});

module.exports = router;
