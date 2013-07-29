
var crypto = require('crypto');		/*	We need this for md5 calculations*/

//Define an object Events that will be exported to other modules through exports.Events
function Events(){};
exports.Events = Events;

//DB client is passed and inititialized from outside...
exports.setAndConnectClient = function(_client){
	client = _client;	//assign it to the module's client var	
	//client.connect();	//connect to DB...
}



/* ********************** GET EVENT FOR ID **********************/
Events.prototype.getEventForId = function(id_event, callback){

	console.log("get event with ID: "+id_event);
	
	var finalJSON = {};
	
	var monitor = new Monitor();		//counter of async queries. 
	monitor.setQueries(3);			//1 to get
	
	//Returns event/invitation/user combination
	/*
	var sql = 'SELECT E.id_event, E.id_creator, E.name, E.description, E.created, I.email_invitation, U.id_user, U.email, U.nickname FROM event E RIGHT JOIN invitation I ON(E.id_event = I.id_event) LEFT JOIN "user" U ON(I.id_user_invited = U.id_user) where E.id_event = $1';
	*/
	
	//returns all event and event creator details
	var sql = 'SELECT E.id_event, E.id_creator, E.name, E.description, E.created, U.email as creator_email, U.nickname as creator_nickname FROM event E LEFT JOIN "user" U ON(E.id_creator= U.id_user) where E.id_event = $1'


	var query =  client.query(sql, [id_event], queryEventId);
	
	function queryEventId(err, result){
	
		if(err) {
			console.log(err.stack);			
			callback(err);			//call callback sending it err
			return;					//stop execution
		}
		
		//If no results found. return empty array
		if(result.rowCount == 0) {
			callback([]);		//No event for the ID. Return empty array
			return;
		}
		
		//console.log(JSON.stringify(result));
		
		result = result.rows;	
		
		var event 	= {}
		
		event.id_event 				= result[0]['id_event']; 
		event.name 					= result[0]['name']; 
		event.description 			= result[0]['description']; 
		event.created 					= result[0]['created']; 
		event.creator_email 		= result[0]['creator_email']; 
		event.creator_nickname = result[0]['creator_nickname']; 
		event.days 						= [];
		event.invited_users = [];
		
		//Get all days for the event
		var sql = 'SELECT * from day_of_event where id_event=$1 order by datetime';
		
		client.query(sql, [id_event], handleDays);
		
		
		//Main query handler holds a nested ones
		function handleDays(err, result){
			
			//console.log(JSON.stringify(result));
			
			if(result.rowCount != 0) {
				rows = result.rows;
				for(var i=0; i<rows.length; i++){
					event.days.push(rows[i]['datetime']);
				}
			}

			//Nested query getting the users for the event
			var sql = 'SELECT E.id_event, I.email_invitation, U.email, I.id_user_invited FROM event E LEFT JOIN invitation I ON(I.id_event = E.id_event) LEFT JOIN "user" U ON(U.id_user = I.id_user_invited) where E.id_event = $1'		
			client.query(sql, [id_event], handleUsers);
				
			if(monitor.isDone() == true) callback(event);						
			
		}//end handleDays()

		
		//Call as a nested inside handleDays
		function handleUsers(err, result){
			//console.log(JSON.stringify(result));
						
			if(result.rowCount != 0) {
				rows = result.rows;
				for(var i=0; i<rows.length; i++){
					event.invited_users.push({
							"email_invitation": rows[i]['email_invitation'],
							"user_email": rows[i]['email']						
						});
				}

				//Inject details for the CREATOR (since he's not in invitation table)
				/*
				event.invited_users.push({
							"email_invitation": event.creator_email,
							"user_email": event.creator_email						
						});
				*/

			}					
			
			//GET AVAILABILITY for EACH INVITED USER + CREATOR
			var sql = 'SELECT I.id_event, I.email_invitation, I.id_user_invited, U.nickname, U.email, DOE.id_day_of_event,DOE.datetime, AV.is_available from invitation I LEFT JOIN "user" U ON(U.id_user = I.id_user_invited) LEFT JOIN day_of_event DOE ON(I.id_event = DOE.id_event) LEFT JOIN user_day_availability AV ON(DOE.id_day_of_event = AV.id_day_of_event AND AV.id_user = I.id_user_invited) where I.id_event = $1'		
			client.query(sql, [id_event], handleAvailability);
			
			if(monitor.isDone() == true) callback(event);		
						
		}
		
		function handleAvailability(err, result){
		
			//console.log("handling availability");
			if(err) {
				console.log(err.stack);			
				callback(err);			//call callback sending it err
				return;					//stop execution
			}
						 
			//For each user U got invited check what they have set as available for the day in the RESULT of the previous query
			for(var i=0; i<event.invited_users.length; i++){	
				
				event.invited_users[i]['availability'] = availabilityForEachDay(event.days, event.invited_users[i]['email_invitation'], result.rows);					
			}
			
			if(monitor.isDone() == true) callback(event);		
			
		}
		
		
		
	}//end
	
	/*	Returns and array with values y, n, m for each day
		It searches a row in rows that has day AND email invitation and it returns is_available value. If its null it converts it into '?'
	*/
	function availabilityForEachDay(days, email_invitation, rows){		
		debugger;
		var availability = [];
		for(var i=0; i<days.length; i++){
			var is_available = "?";		//don't send null because the client cannot parse it easily. Send "?" instead			
			for(var x=0; x<rows.length; x++){
				
				if(rows[x].email_invitation == email_invitation && rows[x].datetime.toJSON() == days[i].toJSON()){					
					is_available = rows[x].is_available;
					if(is_available == null) is_available = "?"
				}  	 		
			}
			
			//console.log("availability for day "+days[i] + ' is '+is_available);
			availability.push(is_available);
		}
		return availability;
	}
		
}


/*
*	Returns an array with json objects for each event with all data about it, invited users and their availability.
*	This method relies on getEventForId method found in tjhe prototype of Events object. What it does is it wueries the DB
*	for events this user can see and then for each id_event runs getEventForId(id, function(result){}).  TODO: implement it without relying on getEventForId
*/
Events.prototype.getAllEvents = function(auth, callback){
	
	var self = this;

	var id_user = auth.getIdUser();

	var monitor = new Monitor();
	
	//returns all events user has been invited to or is a creator of...
	//var sql = 'SELECT DISTINCT e.* from event e, invitation i where (i.id_user_invited=$1 and i.id_event=e.id_event) OR e.id_creator=$1';
	var sql = 'SELECT DISTINCT e.* from event e, event_user eu where (eu.id_user=$1 and eu.id_event=e.id_event) OR e.id_creator=$1';



	var query =  client.query(sql, [id_user], handleReturnEvents);

	function handleReturnEvents(err, result){
		
		var allEvents = [];

		if(err) {
				console.log(err.stack);			
				callback(err);			//call callback sending it err
				return;					//stop execution
		}

		if(result.rowCount == 0) {
			callback([]);		//No events for this user in the DB
			return;
		}

		

		monitor.setQueries(result.rowCount);

		var rows = result.rows;

		for(var i=0;i<rows.length;i++){
			self.getEventForId(rows[i]['id_event'], function(result){
				allEvents.push(result);	
				if(monitor.isDone()) callback(allEvents)	
					
				
			});
		}	
		
	}	
}




/*
************************* CREATE A NEW EVENT	************************
* @newEventJson is the JSON body that came in the POST request body 
* @auth is the authentication object passed from server.post() that holds the current users data: id_user, email...
*/

Events.prototype.insertEvent = function (newEventJson, auth, callback) {
	var id_creator 			= auth.getIdUser();
	var email_creator 		= auth.getEmail();	
	var name 				= newEventJson.name;
	var description  		= newEventJson.description;	
	var days				= newEventJson.days;
	var invited_users		= newEventJson.invited_users;
	
	
	monitor = new Monitor();
	monitor.setQueries(days.length+invited_users.length+3);		//+1 is the insert for the creator_id into event_user table. +1 for the query inserting user_day_availability for  the creator. +1 for inserting creator into invitation table...
	
	var query =  client.query('INSERT INTO event (name, description, id_creator) values ($1,$2, $3) RETURNING id_event', [name, description, id_creator], insertEventHandler);

	function insertEventHandler(err, result){
	
		//console.log("insertEvent RESULT "+JSON.stringify(result));

		if(err) console.log(err);
		var id_event_new = result.rows[0]["id_event"];

		console.log("new event created with ID: "+id_event_new);
		
		//Insert days for the newly created event and days into user_day_availability for the CREATOR
		for(var i=0;i<days.length;i++){
			client.query('INSERT INTO day_of_event (id_event, datetime) VALUES ($1, $2) RETURNING id_day_of_event', [id_event_new, days[i]], function(err, result) { 
				if(err) {
					console.log(err);
					callback(err);
					return;
				}

				var id_day_of_event_new = result.rows[0]["id_day_of_event"];
				
				console.log(JSON.stringify(result));
				
				//Add newly created day into user_day_availability table with creators ID				
				client.query('INSERT INTO user_day_availability (id_user, id_day_of_event) VALUES ($1, $2)', [id_creator, id_day_of_event_new], function(err, result) { 

					if(err) {
						console.log(err);
						callback(err);
						return;
					}

					if(monitor.isDone() == true) callback(id_event_new);
					console.log("INSERT INTO user_day_availability OK for user "+id_creator+"and newly created day "+id_day_of_event_new);	

				});	

				if(monitor.isDone() == true) callback(id_event_new);				
			});	


		}
		
		//Insert invited users for the newly created event into INVITATION. Also, we'll enter creators data into invitation table for simplicity when it comes to getting the data out
		for(var i=0;i<invited_users.length;i++){
			
			var digest_base = invited_users[i]+i+new Date().getTime();
			var invitation_token = crypto.createHash('md5').update(digest_base).digest("hex");
			
			client.query('INSERT INTO invitation (id_event, email_invitation, invitation_token) VALUES ($1, $2, $3)', [id_event_new, invited_users[i]['email_invitation'], invitation_token], function(err, result) { 
				if(err) {
					console.log(err);
					callback(err);
					return;
				}
				
				if(monitor.isDone() == true) callback(id_event_new);
						
			});			
		}//for

		//Insert creators data into invitation. This way it's easier to recolect it later...
		client.query('INSERT INTO invitation (id_event, email_invitation, id_user_invited, invitation_token) VALUES ($1, $2, $3, $4)', [id_event_new, email_creator, id_creator, 'creator'], function(err, result) { 
				if(err) {
					console.log(err);
					callback(err);
					return;
				}
				if(monitor.isDone() == true) callback(id_event_new);		
				
		});

		//Insert creator's id into event_user
		client.query('INSERT INTO event_user (id_event, id_user) VALUES ($1, $2)', [id_event_new, id_creator], function(err, result) { 
				if(err) {
					console.log(err);
					callback(err);
					return;
				}
				if(monitor.isDone() == true) callback(id_event_new);		
				
			});	
					
	}//insertEventHandler		
}





/*
************************* UPDATE AVAILABILITY OF A USER FOR A NEW EVENT	************************
* @updateJson holding an array of json objects with day:availability pairs... { "20-09...":"y" }
* @auth is the authentication object passed from server.post() that holds the current users data: id_user, email...
*/

Events.prototype.updateAvailability = function (id_event, updateJson, auth, callback) {
	var id_user 	= auth.getIdUser();
	
	monitor = new Monitor();
	monitor.setQueries(updateJson.length);		//for each day in the updateJson we will call one update

	console.log("Events.prototype.updateAvailability received updateJson of size "+updateJson.length);

	var daysAvailability = [];

	//Convert the json into nice key value pairs...
	for (i=0; i<updateJson.length; i++) {
		for (key in updateJson[i]) {
	      	
	      	daysAvailability.push({
	      		"datetime": key,
	      		"is_available": updateJson[i][key]
	      	});			
	    }
	}

	
	//For each day received go and do update
	for(var i=0; i<daysAvailability.length; i++){
		var datetime = daysAvailability[i]["datetime"];
		var is_available = daysAvailability[i]["is_available"];

		if(is_available != 'y' && is_available != 'n' && is_available!='m' && is_available!='?'){
			console.log("ERROR! Cannot use value " +is_available+ " to update is_available");
			callback(false);
			return;			
		}

		console.log("About to update day "+datetime+ "with is_available:" +is_available);
		client.query('UPDATE user_day_availability as UDA SET is_available = $4 FROM day_of_event DE where(UDA.id_day_of_event = DE.id_day_of_event AND DE.id_event = $1 AND UDA.id_user=$2 AND "datetime"=$3)', 
			[id_event, id_user, datetime, is_available], updateAvailabilityHandler);

	}
	
	var ERROR;	//since updates are async we cant call callback(err) immediately if it occurs because there'll be another result coming in soon after asking to send the callback
	function updateAvailabilityHandler(err, result){
		//console.log("handling availability");
		if(err) {			
			console.log("updateAvailability query received a json it didn't like!");						
			console.log(err.stack);						
			ERROR = err;
			//return;					//stop execution
		}

		console.log("Result of update"+JSON.stringify(result));

		if(monitor.isDone() == true) {
			if(ERROR) {
				callback(ERROR);
				return;
			}

			callback(true);
		}
	}
		
}

Events.prototype.isUserInEvent = function (id_user, id_event, callback) {
	
	client.query('SELECT * FROM event_user where id_user = $1 AND id_event= $2', [id_user, id_event], userInEventHandler);

	function userInEventHandler(err, result){
		if(err) {			
			console.log("updateAvailability query received a json it didn't like!");						
			console.log(err.stack);						
			callback(err);
			return;					//stop execution
		}	

		console.log("Checking if user "+id_user+" is in event "+id_event);
		//console.log("RESULT is: "+ JSON.stringify(result));
		if(result.rowCount == 0){
			console.log("User doesn't belong to event...");
			callback(false);
		}else {
			console.log("User belongs to event...");
			callback(true);
		}

	}
	
}



/*
	User sends PUT /events/accept?e=email&p=pass&invitation_token=xxxxx... This method associates the authenticated user
	to the invitation corresponding to the token.
*/
Events.prototype.acceptInvitation = function(id_user, invitation_token, callback){

	
	//1 UPDATE INVITATION TABLE BY Changing id_invited_user from -1 tfor the ID of the user calling web service. For sec. reasons we check if id_invited_user=-1. Once accepted noone can change it
	client.query('UPDATE invitation SET id_user_invited=$1 where invitation_token=$2 and id_user_invited=-1 RETURNING id_event', [id_user, invitation_token], updateInvitationHandler);
	function updateInvitationHandler(err, result){
		if(err) {										
			console.log(err.stack);						
			callback(err);
			return;					//stop execution
		}

		console.log("updateInvitationHandler result: "+JSON.stringify(result));

		if(result.rowCount != 1){
			//no invitation token found 
			callback(false);
			return;					//stop execution
		} 

		var id_event = result.rows[0]['id_event'];

	//2 INSERT INTO EVENT_USERS is_user and id_event
		client.query('INSERT into event_user (id_event, id_user) values($1, $2)', [id_event, id_user ], function(err, result){
			if(err) {										
				console.log(err.stack);						
				callback(err);
				return;					//stop execution
			}

			if(result.rowCount != 1){	
				console.log("INSERT into event_user INSERTED NOTHING. probbably already exists....");									
				callback(false);
				return;					//stop execution
			}


			//3 CREATE ENTRIES FOR USER_DAY_AVAILABILITY
			client.query('INSERT into user_day_availability SELECT $1, id_day_of_event, $3 from day_of_event where id_event=$2', [id_user, id_event, 'm'  ], function(err, result){
				if(err) {										
					console.log(err.stack);						
					callback(err);
					return;					//stop execution
				}

				if(result.rowCount == 0){
					console.log("When accepting event invitation INSERT into user_day_availability FAILED: "+JSON.stringify(result));				
					callback(false);
					return;					//stop execution
				}

				callback(true);
			}); 

			

		});


	}

	



};




/*
************************* DELETE AN  EVENT	************************
*/
Events.prototype.deleteEvent = function (param, callback) {
	
	var id_event = param.id_event;
	console.log("Deleting ID: "+id_event);
	
	console.log("NOT IMPLEMENTED!!!!!!!!")

}












/*
	Monitor is used to keep track of async queries to be executed.
	Since queries are asyn this mechanism keeps the reference of a number of queries executed.
	
*/	
function Monitor(){	
	
	var queries = -1;	
	
	this.setQueries = function(num){		this.queries = num;	}
	this.getQueries = function(){				return this.queries;	}	
	this.oneLess	  = function(){						
		this.queries--;	
	}
	this.isDone		  = function(){	
		this.oneLess();
		if(this.queries == 0) {
			return true;
		}else return false;
	}		
	return this;	
}
