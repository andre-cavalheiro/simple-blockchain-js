const express = require('express');
const {addBlockToChain, createBlock} = require('../services/blockServices')
const {sendChain} = require('../services/graphServices')

const router = express.Router();

router.post('/', async function(req, res, next) {
    try{
        await addBlockToChain(req.body.payload,req.db)
        sendChain()
        res.send(true)
    }catch(e){
        //FIXME Send code 500 header
        console.log(e)
        res.send(false)
    }

});

module.exports = router;
