//Define an object Auth that will contain all necessary methods to authenticate and authorize a request
function Auth(){};
exports.Auth = Auth;

//DB client is passed and inititialized from outside...
exports.setAndConnectClient = function(_client){
	client = _client;	//assign it to the module's client var	
	//client.connect();	//connect to DB...
}

Auth.prototype.isAuthenticated = function(authToken, callback){
	var isAuthenticated;
	var sql = 'SELECT * from user where email=$1';
	var query =  client.query(sql, [authToken], function(err, result){				
		if(err) console.log(err);
		debugger;
		callback(true);
	});

}