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



//IMPORT RESOURCES: Events
var eventsResource = require('./events');


//TESTING IF IT WORKS GET localhost:1983/
server.get('/events', function(req, res) {
	
	console.log("request GET  /events ");
	
	var events = new eventsResource.Events() ;
	
	
	//Get all events from DB
	events.getAllEvents(function(result){
		
		var allEvents = result;
		
		console.log("getAllEvents received: "+JSON.stringify(result));
		//res.send(200, allEvents);
		
		//Get all days for each event. 
		events.getAllDaysForEvents(allEvents, function(result){
			events.getAllInvitedUsersForEvents(allEvents, function(result){		
				if(!result) res.send(400,result);
				res.send(200, result);
			});	
		});
	});		
});



server.post('/events', function(req, res) {
	var events = new eventsResource.Events() ;
	
	var newEventJson = req.body;
	
	console.log("request POST  /events with body: "+JSON.stringify(newEventJson));

	var result = events.insertEvent(newEventJson, function(result){
		
		if(!result) res.send(400);
		
		else res.send(200, result);

	});


});


server.del('/events/:id', function(req, res) {
	
	var events = new eventsResource.Events() ;
	
	var idEvent = req.params.id;
	var body = req.body;
	
	console.log("received request  "+req);			//prints the REQUEST details
	console.log("idEvent to delete "+idEvent);		//id passed in the URL
	console.log("Body: "+body);
	
	
	
	var result = events.deleteEvent(idEvent, function(result){
		
		if(!result) res.send(400);
		
		else res.send(200, result);

	});
	
	

});


