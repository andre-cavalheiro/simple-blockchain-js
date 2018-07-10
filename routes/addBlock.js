const express = require('express');
const {addBlockToChain, createBlock} = require('../services/blockServices')
const {spreadNewBlock} = require('../services/graphServices')

const router = express.Router();

router.post('/', async function(req, res, next) {
    try{
        await addBlockToChain({payload: req.body.payload})
        spreadNewBlock()                        // fixme - Should receive index to make sure we're spreading the right one
        res.status(201).send("Block was added with success")
    }catch(err){
        console.error(err)
        res.send("Failed to add block - " + err)
        // Defenir codigo consoante o erro
    }
});

module.exports = router;
