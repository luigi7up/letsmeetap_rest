

var db 	= require('./mysql_conn');
var connection = db.connection;

/*	We need this for md5 calculations*/
var crypto = require('crypto');





//Define an empty object Events that will be exported to other modules through exports.Events
function Events(){};
exports.Events = Events;


//Gets all rows from events table
Events.prototype.getAllEvents = function(callback){
		
		var query =  'SELECT * FROM letsmeetapp.event';
		
		var allEvents;
		
		connection.query( query, queryResultHandler);
		
		function queryResultHandler(err, rows){	
		
			if(err) console.log("ERROR in getAllEvents"+err);
		
			allEvents = rows;
			callback(allEvents)	;	
			
		}//queryResultHandler
}


//Gets days for each event
Events.prototype.getAllDaysForEvents = function(params, callback){
	
	var allEvents = params;
	
	var allDaysForEvents;
	var query =  'SELECT id_event, datetime from letsmeetapp.day_of_event where id_event IN (?)';
	
	var values = [ ];
	
	
	//MUltiple values have to provided as a nested array!!! [values]
	for(var x=0; x<allEvents.length; x++){
		values.push([allEvents[x].id_event]);
	}
	
	connection.query( query, [values], queryResultHandler);
	
	function queryResultHandler(err, rows){
		
		if(err) console.log("ERROR in getAllDaysForEvents"+err);
		
		for(var x=0; x<allEvents.length; x++){
				var daysForEvent= [];
				for(var z=0; z<rows.length; z++){
					if(allEvents[x].id_event == rows[z].id_event) daysForEvent.push(rows[z].datetime);
			
				}
				allEvents[x]['days'] = daysForEvent;
		}
		
		callback(allEvents);	
	}

}


//Gets invited users  for each event
Events.prototype.getAllInvitedUsersForEvents = function(params, callback){
	
	var allEvents = params;
	

	var query =  'SELECT id_event, email from letsmeetapp.invitation I where id_event IN(?)';
	//var query =  'SELECT id_event, username from user U, event_user EU where id_event IN(?) and U.id_user = EU.id_user';
	
	var values = [ ];
	
	
	//Multiple values have to provided as a nested array!!! [values]
	for(var x=0; x<allEvents.length; x++){
		values.push([allEvents[x].id_event]);
	}
	
	console.log("values  "+values);
	
	connection.query( query, [values], queryResultHandler);
	
	function queryResultHandler(err, rows){
		
		if(err) console.log(err);
		
		for(var x=0; x<allEvents.length; x++){
				var invitedUsers= [];
				for(var z=0; z<rows.length; z++){
					if(allEvents[x].id_event == rows[z].id_event) invitedUsers.push(rows[z].email);
			
				}
				allEvents[x]['invited_users'] = invitedUsers;
		}
		
		callback(allEvents);	
	}

}


/**
*	Creating event
*/
Events.prototype.insertEvent = function (newEventJson, callback) {

	var now = new Date();
	
	var name 					= newEventJson.name;
	var description  			= newEventJson.description;
	var creator_id 				= newEventJson.creator_id;
	var days						= newEventJson.days;
	var invited_users		= newEventJson.invited_users;
	
	console.log("insertEvent called ");
	
	var date_of_creation 	= now.toString();
	
	//Takes the QUERY, PARAMETERS TO INSERT, and a callback function for the query result that in turn calls clients callback
	connection.query(
			'INSERT INTO letsmeetapp.event SET `name` = ?, description = ?, creator_id = ?', [name, description, creator_id], function(err, result) { 
			
		if(err) console.log(err);
		
		var newEventId = result.insertId;
		
		console.log("new event created with ID: "+newEventId);
		
		
		console.log("About to inser invited_users: "+invited_users);
		
		//Now insert all days for the newly created event. First create the necessary format for BULK insert
		daysValues = [] ;
		for(var i=0;i<days.length;i++){
			daysValues.push( [newEventId,days[i] ] );
		}
		
		console.log("values"+daysValues);
		
		connection.query('INSERT INTO letsmeetapp.day_of_event (id_event, datetime) VALUES ?', [daysValues], function(err, result2) { 
			if(err) console.log(err);			
		})
		
		
		


		invitedUsersValues = [] ;
		for(var i=0;i<invited_users.length;i++){
		
			//For each invitation for the event generate the unique md5 invitation token
			var digest_base = invited_users[i]+i+new Date().getTime();
			
			var invitation_token = crypto.createHash('md5').update(digest_base).digest("hex");
			
			console.log("token for "+invited_users[i] +" is " +invitation_token); 
			
			invitedUsersValues.push( [newEventId,invited_users[i], invitation_token ] );
		}
		
		console.log("Invited_users: "+invitedUsersValues);
		
		
		connection.query('INSERT INTO letsmeetapp.invitation (id_event, email, invitation_token) VALUES ?', [invitedUsersValues], function(err, result3) { 
			if(err) console.log(err);			
		})
		
		
		/*
		connection.query('INSERT INTO letsmeetapp.event_user (id_event, id_user) VALUES ?', [invitedUsersValues], function(err, result3) { 
			if(err) console.log(err);			
		})
		*/
		
		callback ( result );

	});

};
















Events.prototype.deleteEvent = function (idEvent, callback) {

	console.log("db deleteEvent: "+idEvent);
	
	//Takes the QUERY, PARAMETERS TO INSERT, and a callback function for the query result that in turn calls clients callback
	connection.query(
			'DELETE  FROM letsmeetapp.event where id_event = ?', idEvent, function(err, result) { 			
		if(err) console.log(err);
		callback ( result );

	});

};










