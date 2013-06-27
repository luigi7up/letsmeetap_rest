
var crypto = require('crypto');		/*	We need this for md5 calculations*/

//Define an object Events that will be exported to other modules through exports.Events
function Events(){};
exports.Events = Events;

//DB client is passed and inititialized from outside...
exports.setAndConnectClient = function(_client){
	client = _client;	//assign it to the module's client var	
	client.connect();	//connect to DB...
}



/*
* *******************************GET ALL EVENTS! ****************************************************
*/
Events.prototype.getAllEvents = function(callback){
		
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
			
			console.log("ALL EVENTS callback **** ");
			console.log("**all events:"+JSON.stringify(allEvents));

			for(var i = 0; i<allEvents.length; i++){
				
				var id_event = allEvents[i].id_event;
		
				client.query('SELECT DISTINCT UDA.id_user, I.email, DOE.id_event, DOE.id_day_of_event, DOE.datetime, UDA.is_available	from day_of_event DOE, user_day_availability UDA, user U, invitation I where DOE.id_event = $1 AND I.id_event = DOE.id_event AND DOE.id_day_of_event = UDA.id_day_of_event AND I.id_user_invited = UDA.id_user ', 
						[id_event], queryHandler.bind({"position":i}));
		
			}

			function queryHandler(err, result){
				if(err) console.log(err);	

					var rows =  result.rows;
					var days = [];
					var users = [];
					
					
					console.log("ROWS:"+JSON.stringify(rows));
			
			
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
					
					for(var dayIndex = 0; dayIndex<days.length; dayIndex++){
						var day = days[dayIndex];
						
						for(var z = 0; z<users.length; z++){
							
							for(var y = 0; y<rows.length; y++){
								if(rows[y].email.toString() == users[z] && day.toString() == rows[y].datetime.toString()){
									var email = rows[y].email.toString();
									var email = rows[y].is_available
									
									console.log(rows[y].email.toString() + rows[y].datetime.toString() + rows[y].is_available.toString());
									
									var obj = { };					
									obj[ rows[y].email.toString() ] = rows[y].datetime;
									obj[ "is_available" ] =  rows[y].is_available.toString();

									availability.push(obj);
								}
							}
							
						}
					}
					
					allEvents[this.position].users = availability;				//add it to the final JSON
					
					for(var x = 0; x<availability.length; x++){
						console.log(availability[x]);
					}
					
					if(monitor.isDone() == true) callback(allEvents);			
			}
			
			
			
			
			//Pushes a val onto an array if it doesn't exist
			function addUnique(destination, val){			
				console.log("Value"+val);			
				var flag=false;
				for(var x = 0; x<destination.length; x++){
					if( destination[x].toString() == val.toString() ) flag = true;
				}
				
				if(flag == false) destination.push(val);
			}
			
		}

		/*
		function queryDaysHandler(err, result){		
					
			//"this" is passed as { "position":i, "id_event":... } using bind
			var position = this.position;
			var id_event = this.id_event;
			var days = result.rows;
						
			if(days.length == 0){
				days = [];			
			}else{
				var temp = [];	//extract just the datetime part of the day
				for(var i=0;i<days.length;i++){
					temp.push(days[i].datetime);
				}
				days = temp;
			}			
			
			allEvents[position]["days"] = days ;

			//if(monitor.isDone() == true) return callback(allEvents);	
			if(monitor.isDone() == true) matchDaysWithUsers();			
		}

		function queryInvitedHandler(err, result){			
			
			//"this" is passed as { "position":i, "id_event":... } using bind
			var position = this.position;
			var id_event = this.id_event;
			var invited_users = result.rows;
						
			if(invited_users.length == 0){
				invited_users = [];			
			}else{
				var temp = [];	//extract just the datetime part of the day
				for(var i=0;i<invited_users.length;i++){
					temp.push(invited_users[i].email);
				}
				invited_users = temp;
			}							
			allEvents[position]["invited_users"] = invited_users ;	
			console.log("allEvents[position][invited_users]"+JSON.stringify(allEvents[position]["invited_users"]));			
			//if(monitor.isDone() == true) return callback(allEvents);
			if(monitor.isDone() == true) matchDaysWithUsers();
		}	
		*/
		
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
		
}

/*
************************* CREATE NEW EVENT	************************
*/

Events.prototype.insertEvent = function (newEventJson, callback) {
	var name 					= newEventJson.name;
	var description  			= newEventJson.description;
	var id_creator 				= newEventJson.id_creator;
	var days						= newEventJson.days;
	var invited_users		= newEventJson.invited_users;
	
	console.log("insertEvent called ");
	
	monitor = new Monitor();
	monitor.setQueries(days.length+invited_users.length);
	
	var query =  client.query('INSERT INTO event (name, description, id_creator) values ($1,$2, $3) RETURNING id_event', [name, description, id_creator], insertEventHandler);

	function insertEventHandler(err, result){
	
		
		//console.log("insertEvent RESULT "+JSON.stringify(result));
		
		if(err) console.log(err);
		var id_event_new = result.rows[0]["id_event"];

		console.log("new event created with ID: "+id_event_new);
		
		//Insert days for the newly created event
		for(var i=0;i<days.length;i++){
			client.query('INSERT INTO day_of_event (id_event, datetime) VALUES ($1, $2)', [id_event_new, days[i]], function(err, result) { 
				if(err) console.log(err);					
				
				
				if(monitor.getQueries() == 0) callback(id_event_new);
				
			});			
		}
		
		//Insert days for the newly created event
		for(var i=0;i<invited_users.length;i++){
			
			var digest_base = invited_users[i]+i+new Date().getTime();
			var invitation_token = crypto.createHash('md5').update(digest_base).digest("hex");
			
			client.query('INSERT INTO invitation (id_event, email, invitation_token) VALUES ($1, $2, $3)', [id_event_new, invited_users[i], invitation_token], function(err, result) { 
				
				if(err) console.log(err);
				
				
				if(monitor.getQueries() == 0) callback(id_event_new);
						
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
