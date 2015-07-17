
'use strict';

var fs = require('fs');

var express = require('express');
var app = express();
var cluster = require('thehelp-cluster');

cluster.Graceful.start();

var gracefulExpress = new cluster.GracefulExpress();

app.use(gracefulExpress.middleware);

app.get('/', function(req, res) {
  res.send('<html><body>'
    + '<div><a href="/handlerCrash">Top-level crash in route handler</a></div>'
    + '<div><a href="/longAsyncTask">First, start long task in new tab</a></div>'
    + '<div><a href="/asyncCrash">Then crash the server in new tab</a></div>'
    + '</body></html>');
});

app.get('/handlerCrash', function(req, res) {
  var x = 4;
  x.split();
});

app.get('/longAsyncTask', function(req, res) {
  console.log('long task: start');

  setTimeout(function() {
    console.log('long task: still working!');
  }, 1000);

  setTimeout(function() {
    console.log('long task: done!');
    res.send('success!')
  }, 2000);
});

app.get('/asyncCrash', function(req, res) {
  fs.readFile('nonexistent', function(err, result) {
    var length = result.length;
  });
});

// register error handler
app.use(function(err, req, res, next) {
  console.log('express error handler run!', err.stack);
  res.status(500);
  res.send('express error handler ' + err.stack);
});


// catch top-level exception
process.on('uncaughtException', function(err) {
  cluster.Graceful.instance.shutdown(err);
});

var port = 3000;
gracefulExpress.listen(app, port, function() {
  console.log('express server listening on port ' + port);
});