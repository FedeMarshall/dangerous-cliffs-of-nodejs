
'use strict';

var fs = require('fs');

var express = require('express');
var app = express();
var cluster = require('thehelp-cluster');

cluster.Graceful.start();

var gracefulExpress = new cluster.GracefulExpress();

app.use(gracefulExpress.middleware);

app.get('/', function(req, res) {
  res.send('<html><body>' +
    '<div><a href="/normalError">/normalError - Error returned, not crash</a></div>' +
    '<div><a href="/handlerCrash">/handlerCrash - Crash in route handler</a></div>' +
    '<div><a href="/longAsyncTask">/longAsyncTask - First, start in new tab</a></div>' +
    '<div><a href="/asyncCrash">/asyncCrash - Then crash server in new tab</a></div>' +
    '</body></html>');
});

app.get('/normalError', function(req, res, next) {
  next(new Error('Something went wrong!'));
});

app.get('/handlerCrash', function() {
  var x = 4;
  x.split();
});

app.get('/asyncCrash', function(req, res) {
  fs.readFile('nonexistent', function(err, result) {
    res.send(result.length);
  });
});

// try `sudo kill <pid>` while this endpoint is running!

app.get('/longAsyncTask', function(req, res) {
  console.log('long task: start');

  setTimeout(function() {
    console.log('long task: still working!');
  }, 1000);

  setTimeout(function() {
    console.log('long task: done!');
    res.type('text');
    res.send('success!');
  }, 2000);
});


// register error handler
app.use(function(err, req, res, next) {
  /* jshint unused: false */
  // express error handlers need arity of four

  console.log('express error handler run!', err.stack);
  res.status(500);
  res.type('text');
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
