
var crypto = require('crypto');		/*	We need this for md5 calculations*/

//Define an object Events that will be exported to other modules through exports.Events
function Events(){};
exports.Events = Events;

//DB client is passed and inititialized from outside...
exports.setAndConnectClient = function(_client){
	client = _client;	//assign it to the module's client var	
	client.connect();	//connect to DB...
}



/* ********************** GET EVENT FOR ID **********************/
Events.prototype.getEventForId = function(id_event, callback){

	console.log("get event with ID: "+id_event);
	
	var finalJSON = {};
	
	monitor = new Monitor();		//counter of async queries. 
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
		
		console.log(JSON.stringify(result));
		
		result = result.rows;	
		
		var event 	= {}
		
		event.id_event 				= result[0]['id_event']; 
		event.name 					= result[0]['name']; 
		event.description 			= result[0]['description']; 
		event.creator_email 		= result[0]['creator_email']; 
		event.creator_nickname = result[0]['creator_nickname']; 
		event.days 						= [];
		event.invited_users = [];
		
		//Get all days for the event
		var sql = 'SELECT * from day_of_event where id_event=$1 order by datetime';
		
		client.query(sql, [id_event], handleDays);
		
		
		//Main query handler holds a nested ones
		function handleDays(err, result){
			
			console.log(JSON.stringify(result));
			
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
			console.log(JSON.stringify(result));
						
			if(result.rowCount != 0) {
				rows = result.rows;
				for(var i=0; i<rows.length; i++){
					event.invited_users.push({
							"email_invitation": rows[i]['email_invitation'],
							"user_email": rows[i]['email']						
						});
				}
			}
			//return the constructed event object			
			//if(monitor.isDone() == true) callback(event);				
			//callback(event);						
			
			//AVAILABILITY
			var sql = 'SELECT I.id_event, I.email_invitation, I.id_user_invited, U.nickname, U.email, DOE.id_day_of_event,DOE.datetime, AV.is_available from invitation I LEFT JOIN "user" U ON(U.id_user = I.id_user_invited) LEFT JOIN day_of_event DOE ON(I.id_event = DOE.id_event) LEFT JOIN user_day_availability AV ON(DOE.id_day_of_event = AV.id_day_of_event AND AV.id_user = I.id_user_invited) where I.id_event = $1'		
			client.query(sql, [id_event], handleAvailability);
			
			if(monitor.isDone() == true) callback(event);		
						
		}
		
		function handleAvailability(err, result){
		
			console.log("handling availability");
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
		
		//callback(event);
		
	}//end
	
	/*	Returns and array with values y, n, m for each day
		It searches a row in rows that has day AND email invitation and it returns is_available value. If its null it converts it into '?'
	*/
	function availabilityForEachDay(days, email_invitation, rows){
	
		console.log("handling availability for:" +email_invitation);
		
		console.log("ROWS:"+JSON.stringify(rows));
		console.log("--------------------------------------------------");
	
		var availability = [];
		for(var i=0; i<days.length; i++){
			var is_available;			
			for(var x=0; x<rows.length; x++){
			
			
				console.log("email_invitation:"+rows[x].email_invitation);
				console.log("datetime:"+rows[x].datetime);
				
				if(rows[x].email_invitation == email_invitation && rows[x].datetime.toJSON() == days[i].toJSON()){
					is_available = rows[x].is_available;
				}  	 		
			}
			
			console.log("availability for day "+days[i] + ' is '+is_available);
			availability.push(is_available);
		}
		return availability;
	}
		
}

/*
************************* CREATE A NEW EVENT	************************
*/

Events.prototype.insertEvent = function (newEventJson, callback) {
	var name 					= newEventJson.name;
	var description  			= newEventJson.description;
	var id_creator 			= newEventJson.id_creator;
	var days					= newEventJson.days;
	var invited_users		= newEventJson.invited_users;
	
	console.log("insertEvent called ");
	
	monitor = new Monitor();
	monitor.setQueries(days.length+invited_users.length);
	
	var query =  client.query('INSERT INTO event (name, description, id_creator) values ($1,$2, $3) RETURNING id_event', [name, description, id_creator], insertEventHandler);

	function insertEventHandler(err, result){
	
		console.log("insertEvent RESULT "+JSON.stringify(result));

		if(err) console.log(err);
		var id_event_new = result.rows[0]["id_event"];

		console.log("new event created with ID: "+id_event_new);
		
		//Insert days for the newly created event
		for(var i=0;i<days.length;i++){
			client.query('INSERT INTO day_of_event (id_event, datetime) VALUES ($1, $2)', [id_event_new, days[i]], function(err, result) { 
				if(err) console.log(err);					

				if(monitor.isDone() == true) callback(id_event_new);		
				
			});			
		}
		
		//Insert days for the newly created event
		for(var i=0;i<invited_users.length;i++){
			
			var digest_base = invited_users[i]+i+new Date().getTime();
			var invitation_token = crypto.createHash('md5').update(digest_base).digest("hex");
			
			client.query('INSERT INTO invitation (id_event, email, invitation_token) VALUES ($1, $2, $3)', [id_event_new, invited_users[i], invitation_token], function(err, result) { 
				
				if(err) console.log(err);

				if(monitor.isDone() == true) callback(id_event_new);
						
			});			
		}	
	}		
}





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
