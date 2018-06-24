const express = require('express');
const {addBlockToChain, createBlock} = require('../services/blockServices')
const {sendBlock} = require('../services/graphServices')

const router = express.Router();

router.post('/', function(req, res, next) {
    try{
        addBlockToChain(req.body.payload)
        sendBlock()
        res.send(true)
    }catch(e){
        //FIXME Send code 500 header
        console.log(e)
        res.send(false)
    }

});

module.exports = router;
