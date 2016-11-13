var express = require('express');
var app = express();
var server = require('http').Server(app);

//starts up the server
app.listen(3000, function() {
	console.log("Server up on localhost:3000");
});

app.use(express.static(__dirname));

//sends the data to the index.html file
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});