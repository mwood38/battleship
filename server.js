var express = require('express'),
  	app 	  = express(),
  	http	  = require('http'),
  	connect = require('connect'),
  	io		  = require('socket.io'),
    fs      = require('fs'),
  	port	  = (process.env.PORT || 8081);

app.set('title', 'Battleship');
// console.log(app)
// Setup Express
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view options', { layout: false });
    app.use(connect.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "shhhhhhhhh!"}));
    app.use(connect.static(__dirname + '/public'));
    app.use(app.router);
});


// Version 3.x of Express needs this server param
var server = http.createServer(app);


// Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function(socket){
  console.log('Client Connected');
  socket.on('message', function(data){
    socket.broadcast.emit('server_message',data);
    socket.emit('server_message',data);
  });
  socket.on('disconnect', function(){
    console.log('Client Disconnected.');
  });
});

server.listen(port);


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

app.get('/', function(req, res){ 
  var locals = {
    title : 'Battleship :: Home',
    description: 'This page is about Battleship and how it rocks.'
  }

  res.render('index.jade', locals);
});


// How do we protect these pages?
app.get('/game', function(req, res){ 

  var locals = {
    title : 'Battleship :: Game',
    description: 'This page has a real Battleship game.'
  }
  
  res.render('game.jade', locals);
});

app.get('/account', function(req, res){ 
  var locals = {
    title : 'Battleship :: Account',
    description: 'This page has your account information for your Battleship user.'
  }
  
  res.render('account.jade', locals);
});


/* Game API stuff */

// this is for saving the game pieces
//NOTE: Will probably want to pass in the game id in the url here
// ie 'game/:id/lock'
app.post("/game/lock", function(req, res) {
  // req.body is the obj:
  // {shipName: cell_nums}
  // so loop through req.body and make sure there's no missing cell nums
  for(var ship in req.body) {
    if(req.body[ship].length == 0) {
      res.send(false);
    }
  }

  // now save them to the socket io session....
  res.send('true');
});


// Errors - need to test these and also add a case for 404
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, 'Something broke!');
});

// @TODO Figure out how to use your IP...
console.log('Listening on http://0.0.0.0:' + port );