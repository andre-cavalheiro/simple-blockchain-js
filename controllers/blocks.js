const express = require('express');
const blocks = require('../services/blockServices')

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log(blocks)
    const eval = blocks.addBlock("helloooo")
    console.log(eval)
    res.send(eval);
});

module.exports = router;
