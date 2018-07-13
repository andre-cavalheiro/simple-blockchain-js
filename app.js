const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');
const getPeers = require('./routes/getPeers');
const addPeer = require('./routes/addPeer');
const addBlock = require('./routes/addBlock');
const {url, dbName} = require('./config/db')
const {initP2PServer, connectToPears} = require('./services/graphServices')
const {initChain} = require('./services/chainServices')

// Get environment defined variables
const http_port = process.env.HTTP_PORT || 3000;
const p2p_port = process.env.P2P_PORT || 6000;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const dbUrl = process.env.DB ? process.env.DB : url;

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// Above: Import libraries and set default values

//Connect to db
mongoose.connect(dbUrl + '/' + dbName).then(() => {
    console.log('Connected to DB in ' + dbUrl)
})

// Whether build blockchain from genesis block, or request the current chain from peers.
initChain(initialPeers).then(() => {
    //Connect to known peers if there are any
    connectToPears(initialPeers, true)
    console.log('Chain initialized with success!')
}).catch(err => {
    console.log('Failed to initialized chain... ' + err)
    process.exit(1)
})

//Allow connections from new peers
initP2PServer(p2p_port);

// Ready HTTP API
app.use('/', indexRouter);
app.use('/peers', getPeers);
app.use('/peers', addPeer);
app.use('/add-block',addBlock );

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});

// Launch API server
app.listen(http_port, () => console.log('Waiting for commands on port: ' + http_port));

module.exports = app;
