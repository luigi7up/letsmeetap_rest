
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

exports.client = client;
