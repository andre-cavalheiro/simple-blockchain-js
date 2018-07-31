const express = require('express');
const {addBlockToChain} = require('../services/chainServices')
const {spreadNewBlock} = require('../services/communicationServices')

const router = express.Router();

router.post('/', async function(req, res, next) {
    console.log('- Adding brand new block')
    addBlockToChain({payload: req.body.payload}).then( (newBlock) => {
        spreadNewBlock(newBlock)
        res.status(201).send("Block was added with success")
    }).catch((err) => {
        //fixme - Defenir codigo consoante o erro
        console.error(err)
        res.send("Failed to add block - " + err)
    })
})

module.exports = router;
