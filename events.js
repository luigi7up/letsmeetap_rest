
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
	
	monitor = new Monitor();
	
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
		
		//Get all days for the event
		var sql = 'SELECT * from day_of_event where id_event=$1 order by datetime';
		
		client.query(sql, [id_event], handleDays);
		
		function handleDays(err, result){
			
			event.days = [];
			console.log(JSON.stringify(result));
			
			if(result.rowCount != 0) {
				rows = result.rows;
				for(var i=0; i<rows.length; i++){
					event.days.push(rows[i]['datetime']);
				}
			}

			//return the constructed event object
			//callback(event);	
			
		}

		//Get data for users invited to this event
		var sql = 'SELECT E.id_event, I.email_invitation, U.email, I.id_user_invited FROM event E LEFT JOIN invitation I ON(I.id_event = E.id_event) LEFT JOIN "user" U ON(U.id_user = I.id_user_invited) where E.id_event = $1'
		
		client.query(sql, [id_event], handleUsers);
		
		function handleUsers(err, result){
			console.log(JSON.stringify(result));
			
			event.invited_users = [];
						
			if(result.rowCount != 0) {
				rows = result.rows;
				for(var i=0; i<rows.length; i++){
					event.invited_users.push({
							"invited_email": rows[i]['email_invitation'],
							"user_email": rows[i]['email'],
							"availability": ['m','m','m','m','m']							
						});
				}
			}

			//return the constructed event object
			callback(event);	
			
		}
		
		
		//Get the availability of every user for each day
		



		
	}



/*		
		//Number of queries that will be executed is number of events * 2 (one query for invited users and the othr for days). To synchronize them
		monitor = new Monitor();
			
		console.log("Events.prototype.getAllEvents");
		var allEvents = [];
		
		var query =  client.query('SELECT * FROM event', queryAllEventsHandler);
		
	
		function queryAllEventsHandler(err, result){		
			allEvents = result.rows;
			
			if(allEvents.length == 0) callback([]);
			//Monitoring async queries number			
			monitor.setQueries(allEvents.length);
			
//			console.log("ALL EVENTS callback **** ");
//			console.log("**all events:"+JSON.stringify(allEvents));

			for(var i = 0; i<allEvents.length; i++){
				
				var id_event = allEvents[i].id_event;
		
				client.query('SELECT DISTINCT UDA.id_user, I.email, DOE.id_event, DOE.id_day_of_event, DOE.datetime, UDA.is_available	from day_of_event DOE, 	user_day_availability UDA, user U, invitation I where DOE.id_event = $1 AND I.id_event = DOE.id_event AND DOE.id_day_of_event = UDA.id_day_of_event AND 				I.id_user_invited = UDA.id_user ', 
						[id_event], queryHandler.bind({"position":i}));
		
			}

			function queryHandler(err, result){
				if(err) console.log(err);	

					var rows =  result.rows;
					var days = [];
					var users = [];
										
					console.log("HAdling Event ID:"+rows[0].id_event);
			
			
					//console.log("RESULT::::::::::::::::::::::::"+JSON.stringify(rows));
											
					//extract unique days						
					for(var x = 0; x<rows.length; x++){
						addUnique(days, rows[x].datetime);
					}
					allEvents[this.position].days = days;		//add it to the final JSON
					
					//Extract unique emails					
					for(var x = 0; x<rows.length; x++){
						addUnique(users, rows[x].email);
					}
					
					
					//For each day we're returning in JSON, go through all users and get availability for that particilar day
					var availability = [];
					
					
					for(var usersIndex = 0; usersIndex<users.length; usersIndex++){
						//Takes user 1 and searches in the rows result each day
						var user = users[usersIndex];
						userAvailability = {}
						
						console.log(">>USER" + user);
						
						temp = [];
						
						for(var dayIndex = 0; dayIndex<days.length; dayIndex++){
							//Now for each day go through rows and see if user has available true or false for it
							var day = days[dayIndex];
							
							console.log(">>DAY" + day);
							
							for(var y = 0; y<rows.length; y++){
								rowUser      		=rows[y].email.toString();
								rowDay				=rows[y].datetime.toString();		//note this is a string representation!!!
								rowAvailability		=rows[y].is_available;
								
								if(user  == rowUser){
									//This is about the user we're on in the loop
									if(day == rowDay){
										temp.push(rowAvailability);
									}
								}
								
							}
							
							
							
						}
						
						userAvailability[user] = temp;
						availability.push(userAvailability);
					
					}
									
					allEvents[this.position].invited_users = availability;				//add it to the final JSON
					
					if(monitor.isDone() == true) callback(allEvents);			
			}
			
			//Pushes a val onto an array if it doesn't exist
			function addUnique(destination, val){			
				//console.log("Value"+val);			
				var flag=false;
				for(var x = 0; x<destination.length; x++){
					if( destination[x].toString() == val.toString() ) flag = true;
				}
				
				if(flag == false) destination.push(val);
			}
			
		}

		//After the days and invited users are fetched from DB final JSON has to have additional information defining availability of every user for each day
		function matchDaysWithUsers(){
			for(var i = 0; i<allEvents.length; i++){
				var id_event = allEvents[i].id_event;
				
				client.query('SELECT DISTINCT UDA.id_user, DOE.id_event, DOE.id_day_of_event, DOE.datetime, UDA.is_available	from day_of_event DOE, user_day_availability UDA	where DOE.id_event = $1 AND DOE.id_day_of_event = UDA.id_day_of_event', 
					[id_event], function(err, result) {
						
						if(err) console.log(err);
						
						console.log("AVAILABILITY", result);
						//callback(result)
						
				
				});

			}
		}
*/		
		
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
