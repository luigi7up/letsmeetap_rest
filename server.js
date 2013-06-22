/*
 * Main app module, contains server routes and basic request-response logic.
 */

var PORT = 5000;
var restify = require('restify');

var options = {
	serverName: 'Lets meetapp node.js apis',
	accept: [ 'application/json' ]
}

var server = restify.createServer(options);

server.use(restify.bodyParser({ mapParams: false }));

server.listen(PORT);
console.log("listening "+PORT);
/*******************	END SERVER SETUP	************************** */




//TESTING IF IT WORKS GET localhost:1983/
server.get('/events', function(req, res) {
	
		
	if(!result) res.send(400,"Fuck!");
	res.send(200, "You asked for events ");
		
});




