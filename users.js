
var crypto = require('crypto');		/*	We need this for md5 calculations*/

//Define an object Events that will be exported to other modules through exports.Events
function Users(){};
exports.Users = Users;

//DB client is passed and inititialized from outside...
exports.setAndConnectClient = function(_client){
	client = _client;	//assign it to the module's client var	
	//client.connect();	//connect to DB...
}



/*
*	If user with email/pass provided exist returns (callbacks) true and false in case it doesnt. Codes are 200 and 401 respectively
*/
Events.prototype.emailPassExist = function(email, md5Pass, callback){

	console.log("user is checking its credentials "+email + md5Pass);
			
	var monitor = new Monitor();		//counter of async queries. 
	monitor.setQueries(1);			//1 to get
	
	
	//returns all event and event creator details
	var sql = 'SELECT * from "user" where email = $1 and password = $2'


	var query =  client.query(sql, [email, md5Pass], queryUserHandler);
	
	function queryUserHandler(err, result){
	
		if(err) {
			console.log(err.stack);			
			callback(err);			//call callback sending it err
			return;					//stop execution
		}
		
		//If no results found. return empty array
		if(result.rowCount == 0) {
			callback(false);		//No event for the ID. Return empty array
			return;
		}else {
			callback(true);			//User with email and pass found
			return;

		}
		
	}//end

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
