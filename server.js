/*
 * Main app module, contains server routes and basic request-response logic.
 */

var PORT = 1983;
var restify = require('restify');

var options = {
	serverName: 'Lets meetapp node.js apis',
	accept: [ 'application/json' ]
}

var server = restify.createServer(options);

server.use(restify.bodyParser({ mapParams: false }));

server.listen(PORT, '0.0.0.0');
console.log("listening "+PORT);
/*******************	END SERVER SETUP	************************** */




//TESTING IF IT WORKS GET localhost:1983/
server.get('/events', function(req, res) {
	
		
	if(!result) res.send(400,"Fuck!");
	res.send(200, "You asked for events ");
		
});




