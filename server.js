
var PORT = process.env.PORT || 1983;
var restify = require('restify');

var options = {
	serverName: 'Lets meetapp node.js apis',
	accept: [ 'application/json' ]
}

var server = restify.createServer(options);

server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.queryParser());		//Enables parsing the URL parameters

/*	* ***************************AUTHENTIFICATION INTERCEPTOR ****************************************/
//based on http://stackoverflow.com/questions/11038830/how-to-intercept-node-js-express-request
var auth;
server.use(function(req,res,next){
	var authToken = req.query.auth;
	auth = new authResource.Auth();	
	auth.authenticate(authToken, function(result){
		next();	//after authentification proceed with the next handler in chain...
	});
});

server.listen(PORT);
console.log("listening "+PORT);

/**********************************DB, resources, authentication module... *********************************************/
//Database
var db_conn = require('./db_conn');
db_conn.client.connect();

//IMPORT RESOURCES: Events
var eventsResource = require('./events');
eventsResource.setAndConnectClient(db_conn.client);

//Auth module
var authResource = require('./authentication');
authResource.setAndConnectClient(db_conn.client);


/**********************************         ROUTES                *********************************************/
/*
*	GET /events 
*	Returns all events that a authenticated user can see 
*/
server.get('/events', function(req, res) {

	/* If the request has to authenticated use this in every resource handler! */
	if(auth.isAuthenticated() == false) {
		res.send(auth.accessDenied().code, auth.accessDenied().msg);
		return;		
	}
	
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




/************************** GET EVENT FOR ID *********************************************/
server.get('/events/:id', function(req, res) {
	
	/* If the request has to authenticated use this in every resource handler! */
	if(auth.isAuthenticated() == false) {
		res.send(auth.accessDenied().code, auth.accessDenied().msg);
		return;		
	}	
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



/*******************************************CREATE EVENT ************************************************/
server.post('/events', function(req, res) {

	/* If the request has to authenticated use this in every resource handler! */
	if(auth.isAuthenticated() == false) {
		res.send(auth.accessDenied().code, auth.accessDenied().msg);
		return;		
	}	
	
	var events = new eventsResource.Events() ;
	
	var newEventJson = req.body;
		
	//console.log("request POST  /events with body: "+JSON.stringify(newEventJson));

	var result = events.insertEvent(newEventJson, auth, function(result){			
		
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

