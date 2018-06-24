const express = require('express');
const bodyParser = require('body-parser');
const indexRouter = require('./controllers/index');
const getPeers = require('./controllers/getPeers');
const addPeer = require('./controllers/addPeer');
const blocks = require('./controllers/blocks');
const graph = require('./services/graphServices')

// Get environment defined variables
const http_port = process.env.HTTP_PORT || 3000;
const p2p_port = process.env.P2P_PORT || 6000;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const app = express();

app.use(bodyParser.json());

// Ready API
app.use('/', indexRouter);
app.use('/peers', getPeers);
app.use('/peers', addPeer);
app.use('/blocks',blocks );

// Launch Peer Server
// await initP2PServer();
graph.initP2PServer();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});

//Launch API server
app.listen(http_port, () => console.log('Conquering the world on port: ' + http_port));

module.exports = app;
