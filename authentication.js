//Define an object Auth that will contain all necessary methods to authenticate and authorize a request
function Auth(){
	var authenticated = false;
	var id_user;
	var email;
};
exports.Auth = Auth;

//DB client is passed and inititialized from outside...
exports.setAndConnectClient = function(_client){
	client = _client;	//assign it to the module's client var	
	//client.connect();	//connect to DB...
}

Auth.prototype.authenticate = function(authToken, callback){
	var self = this;	
	var sql = 'SELECT * from "user" where email=$1';
	var query =  client.query(sql, [authToken], function(err, result){				
		if(err){
			console.log(err)
			callback(err);
			return;
		}		
		if(result.rowCount == 0) {
			self.authenticated = false;
			callback(false);
		}else{
			//result.rows[0] = {activation_token: "xxx", created: Date, email: "user6real@abc.com", id_user: 6 nickname: "User6Nick" password: "654654}
			self.setIdUser(result.rows[0].id_user);
			self.setEmail(result.rows[0].email);
			self.authenticated = true;
			console.log("User "+self.getIdUser()+" identified");			
			callback(true);
		}
	});
}

Auth.prototype.accessDenied = function (){
	var response = {
		"code":401,
		"msg": "Request not authenticated"
		}
	
	return response;	
}
//SETTER GETTER
Auth.prototype.isAuthenticated = function(){
	return this.authenticated;
}

Auth.prototype.getIdUser = function(){
	return this.id_user;
}
Auth.prototype.setIdUser = function(id_user){
	this.id_user = id_user;
}
Auth.prototype.getEmail = function(){
	return this.email;
}
Auth.prototype.setEmail = function(email){
	this.email = email;
}