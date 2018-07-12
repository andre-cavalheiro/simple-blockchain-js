const express = require('express');
const {addBlockToChain, createBlock} = require('../services/chainServices')
const {broadcast} = require('../services/graphServices')
const messageTypes = require('../config/messageTypes')

const router = express.Router();

router.post('/', async function(req, res, next) {
    try{
        const newBlock = await addBlockToChain({payload: req.body.payload})
        broadcast(messageTypes.sendBlock, newBlock)
        res.status(201).send("Block was added with success")
    }catch(err){
        console.error(err)
        res.send("Failed to add block - " + err)
        // Defenir codigo consoante o erro
    }
});

module.exports = router;
