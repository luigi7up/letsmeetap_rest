
/*
	List of options of connection
	
	host: 	The hostname of the database you are connecting to. (Default: localhost)
	port: 	The port number to connect to. (Default: 3306)
	socketPath: The path to a unix domain socket to connect to. When used host and port are ignored.
	user: 	The MySQL user to authenticate as.
	password: 	The password of that MySQL user.
	database: 	Name of the database to use for this connection (Optional).
	charset: The charset for the connection. (Default: 'UTF8_GENERAL_CI')
	timezone: The timezone used to store local dates. (Default: 'local')
	stringifyObjects: Stringify objects instead of converting to values. See issue #501. (Default: 'false')
	insecureAuth: Allow connecting to MySQL instances that ask for the old (insecure) authentication method. (Default: false)
	typeCast: Determines if column values should be converted to native JavaScript types. (Default: true)
	queryFormat: A custom query format function. See Custom format.
	supportBigNumbers: When dealing with big numbers (BIGINT and DECIMAL columns) in the database, you should enable this option (Default: false).
	bigNumberStrings: Enabling both supportBigNumbers and bigNumberStrings forces big numbers (BIGINT and DECIMAL columns) to be always returned as JavaScript String objects (Default: false). Enabling supportBigNumbers but leaving bigNumberStrings disabled will return big numbers as String objects only when they cannot be accurately represented with JavaScript Number objects (which happens when they exceed the [-2^53, +2^53] range), otherwise they will be returned as Number objects. This option is ignored if supportBigNumbers is disabled.
	debug: Prints protocol details to stdout. (Default: false)
	multipleStatements: Allow multiple mysql statements per query. Be careful with this, it exposes you to SQL injection attacks. (Default: false)
	flags: List of connection flags to use other than the default ones. It is also possible to blacklist default ones. For more information, check Connection Flags.
*/


//Require mysql connector lib
var mysql      = require('mysql');

var conn_conf= {
	host     : 'localhost',
	port		:3306,
	user     : 'root',
	password : '',
	database: 'letsmeetapp'
}

var connection = mysql.createConnection(conn_conf);

connection.connect(function(err) {
	if(err) console.log("Could not connect to DB");
	else{
		console.log("Connected to "+conn_conf.database+' on '+conn_conf.host );
	}
});

exports.connection = connection;


/*
//Define an empty object Events that will be exported to other modules through exports.Events
function Events(){};
exports.Events = Events;


//Gets all rows from events table
Events.prototype.getAllEvents = function(callback){
		
		var query =  'SELECT * FROM letsmeetapp.events';
		
		var allEvents;
		
		connection.query( query, queryResultHandler);
		
		function queryResultHandler(err, rows){	
		
			if(err) console.log(err);
		
			allEvents = rows;
			callback(allEvents)	;	
			
		}//queryResultHandler
		

	
}


//Gets days for each event
Events.prototype.getAllDaysForEvents = function(params, callback){
	
	var allEvents = params;
	
	var allDaysForEvents;
	var query =  'SELECT id_event, datetime from letsmeetapp.days_of_event where id_event IN (?)';
	
	var values = [ ];
	
	
	//MUltiple values have to provided as a nested array!!! [values]
	for(var x=0; x<allEvents.length; x++){
		values.push([allEvents[x].id_event]);
	}
	
	connection.query( query, [values], queryResultHandler);
	
	function queryResultHandler(err, rows){
		
		if(err) console.log(err);
		
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
	
	var query =  'SELECT id_event, username from users U, event_users EU where id_event IN(?) and U.id_user = EU.id_user';
	
	var values = [ ];
	
	
	//MUltiple values have to provided as a nested array!!! [values]
	for(var x=0; x<allEvents.length; x++){
		values.push([allEvents[x].id_event]);
	}
	
	connection.query( query, [values], queryResultHandler);
	
	function queryResultHandler(err, rows){
		
		if(err) console.log(err);
		
		for(var x=0; x<allEvents.length; x++){
				var invitedUsers= [];
				for(var z=0; z<rows.length; z++){
					if(allEvents[x].id_event == rows[z].id_event) invitedUsers.push(rows[z].username);
			
				}
				allEvents[x]['invited_users'] = invitedUsers;
		}
		
		callback(allEvents);	
	}

}



Events.prototype.insertEvent = function (newEventJson, callback) {

	var now = new Date();
	
	var name 					= newEventJson.name;
	var description  			= newEventJson.description;
	var creator_id 				= newEventJson.creator_id;
	
	console.log("Creating event with name: "+name+"; description: "+description+"; creator_id: "+creator_id);
	
	var date_of_creation 	= now.toString();
	
	
	//Takes the QUERY, PARAMETERS TO INSERT, and a callback function for the query result that in turn calls clients callback
	connection.query(
			'INSERT INTO letsmeetapp.events SET `name` = ?, description = ?, creator_id = ?', [name, description, creator_id], function(err, result) { 
			
		if(err) console.log(err);
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

*/








