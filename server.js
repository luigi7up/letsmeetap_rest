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


//Database
var db_conn = require('./db_conn');

//IMPORT RESOURCES: Events
var eventsResource = require('./events');
eventsResource.setAndConnectClient(db_conn.client);



/*
*	GET /events
*/
server.get('/events', function(req, res) {

	
	
	//TODO Optimize this method cause it relies on multiple call on events.getEventForId()
	console.log("request GET  /events on "+new Date().getMilliseconds());
	var events = new eventsResource.Events() ;
	
	var finalJSON = [];

	
	//Get all events from DB
	events.getAllEvents(function(result){
		
		//Exception occured and returned
		if(result instanceof Error) {
			res.send(500, "Internal server error");
			return;
		}

		var allEvents = result;

		console.log("RESPONSE sent on "+new Date().getMilliseconds())
		//If no events exist return 200 and and empty JSON
		if(allEvents.length == 0) {
			res.send(200, []);
			return;
		}else res.send(200, result);
	});
		

});

/*	GET event by ID	*/
server.get('/events/:id', function(req, res) {
	
	var id_event = req.params.id;
		
	var events = new eventsResource.Events() ;
	
	//Get all events from DB
	var err = events.getEventForId(id_event, function(result){
		
		//Exception occured and returned
		if(result instanceof Error) {
			res.send(500, "Internal server error");
			return;
		}
		
		var event = result;
		
		//console.log("getAllEvents received: "+JSON.stringify(result));
		//res.send(200, allEvents);
		
		//If no events exist return 200 and and empty JSON
		if(event.length == 0) {
			res.send(202, "No event for this ID");			
			return;
		}else res.send(200, event);
				
	});	
		

});



/*
*	POST /events
*/
server.post('/events', function(req, res) {

	var events = new eventsResource.Events() ;
	
	var newEventJson = req.body;
	
	console.log("-----------------------------------------------------------------------");
	console.log("request POST  /events with body: "+JSON.stringify(newEventJson));

	var result = events.insertEvent(newEventJson, function(result){
		
		if(!result) res.send(400);
		
		else res.send(200, result);

	});


});

/* *
*	DELETE event (DEL /events/x)
*/

server.del('/events/:id', function(req, res) {
	
	var events = new eventsResource.Events() ;
	
	var id_event = req.params.id;
	var body = req.body;
	
	console.log("received request  "+req);			//prints the REQUEST details
	console.log("idEvent to delete "+id_event);		//id passed in the URL
	console.log("Body: "+body);	
	
	var param = {"id_event":id_event};			//TODO insert into param object authentication stuff!

	
	var result = events.deleteEvent(id_event, function(result){
		
		if(!result) res.send(400);
		
		else res.send(200, result);

	});
	
});


/*
*	Availability for the event
*/

/*
server.get('/events/:id/availability', function(req, res) {
	
	var events = new eventsResource.Events() ;
	
	var id_event = req.params.id;
	var body = req.body;
	
	console.log("received request  "+req);			//prints the REQUEST details
	console.log("idEvent to delete "+id_event);		//id passed in the URL
	console.log("Body: "+body);	
	
	var param = {"id_event":id_event};			//TODO insert into param object authentication stuff!

	
	var result = events.getAvailability(param, function(result){
		
		if(!result) res.send(400);
		
		else res.send(200, result);

	});
	
});
*/