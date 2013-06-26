/*
 * Main app module, contains server routes and basic request-response logic.
 */


var PORT = process.env.PORT || 1983;
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


//IMPORT RESOURCES: Events
var eventsResource = require('./events');


/*
*	GET /events
*/
server.get('/events', function(req, res) {
	
	console.log("request GET  /events ");
	var events = new eventsResource.Events() ;
	
	//Get all events from DB
	events.getAllEvents(function(result){
		
		var allEvents = result;
		
		//console.log("getAllEvents received: "+JSON.stringify(result));
		//res.send(200, allEvents);
		
		//If no events exist return 200 and and empty JSON
		if(allEvents.length == 0) {
			res.send(200, []);
			return;
		}else res.send(200, result);
		
		
	});		

});



/*
*	POST /events
*/
server.post('/events', function(req, res) {

	var events = new eventsResource.Events() ;
	
	var newEventJson = req.body;
	
	console.log("request POST  /events with body: "+JSON.stringify(newEventJson));

	var result = events.insertEvent(newEventJson, function(result){
		
		if(!result) res.send(400);
		
		else res.send(200, result);

	});


});
