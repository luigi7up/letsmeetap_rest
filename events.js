
var crypto = require('crypto');		/*	We need this for md5 calculations*/




/*	DATABASE */
var pg = require('pg');
var config = require('./config.json');

//var conString = "postgres://root:root@localhost:5432/letsmeetapp";
var conString = "tcp://"+config.db.username+":"+config.db.password+"@"+config.db.host+":"+config.db.port+"/"+config.db.name;
var client = new pg.Client(conString);

if(!client){
	console.log("Starting client to DB "+conString+ " failed")
}else{
	console.log("Started client to  DB"+client.host+"/"+client.database);
}

client.connect();

//Define an object Events that will be exported to other modules through exports.Events
function Events(){};
exports.Events = Events;


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
			monitor.setQueries(allEvents.length * 2);
			
			console.log("ALL EVENTS callback **** ");
			console.log("**all events:"+JSON.stringify(allEvents));

			for(var i = 0; i<allEvents.length; i++){
				console.log("SELECTS FOR id_event"+allEvents[i].id_event);
				
				//Note that we use bind to pass an extra arg as THIS...
				client.query('SELECT * FROM day_of_event where id_event = $1',[allEvents[i].id_event], queryDaysHandler.bind( {"position":i, "id_event":allEvents[i].id_event}));				
				//Note that we use bind to pass an extra arg as THIS...
				client.query('SELECT email FROM invitation where id_event = $1',[allEvents[i].id_event], queryInvitedHandler.bind( {"position":i, "id_event":allEvents[i].id_event}));
				
			}		
		}

		
		function queryDaysHandler(err, result){		
			monitor.oneLess();			
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

			if(monitor.isDone() == true) return callback(allEvents);			
		}

		function queryInvitedHandler(err, result){			
			monitor.oneLess();			
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
			if(monitor.isDone() == true) return callback(allEvents);
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
				
				monitor.oneLess();
				if(monitor.getQueries() == 0) callback(id_event_new);
				
			});			
		}
		
		//Insert days for the newly created event
		for(var i=0;i<invited_users.length;i++){
			
			var digest_base = invited_users[i]+i+new Date().getTime();
			var invitation_token = crypto.createHash('md5').update(digest_base).digest("hex");
			
			client.query('INSERT INTO invitation (id_event, email, invitation_token) VALUES ($1, $2, $3)', [id_event_new, invited_users[i], invitation_token], function(err, result) { 
				
				if(err) console.log(err);
				
				monitor.oneLess();
				if(monitor.getQueries() == 0) callback(id_event_new);
						
			});			
		}	
	}		
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
		if(this.queries == 0) {
			return true;
		}else return false;
	}		
	return this;	
}
