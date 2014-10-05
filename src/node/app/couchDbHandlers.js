//set couchdb admin name and password here
var couchnano = require("nano")("http://admin:admin@localhost:5984");

function createNewUserDatabase(dbname,useremail,userpassword,response){
//When a user signs up, create a new database for them and grant them r/w access
	var dbname = useremail;
	//dbname is to be the email address with @ converted to $ (couchdb requirement)
	var dbname = dbname.replace("@","$"); 
	//replace '.' with '+'
	var dbname = dbname.replace(".","+");
	
	console.log("createNewUserDatabase: dbname["+ dbname +"], useremail["+ useremail +"], userpassword["+ userpassword +"]");
	
	
	
	//create user in _users table
	var _users = couchnano.use("_users");
	var json = {"_id":"org.couchdb.user:" + useremail,"name":useremail,"roles":[],"type":"user","password":userpassword};
	_users.insert(json, "", function(error, body, headers){
		if (error) {
			console.log(error.message);
			return response.status(error["status-code"]).send(error.message);
			//response.send(error.message, error["status-code"]);			
		}
		console.log(body);		
	});

	//create db for user
	couchnano.db.create(dbname, function(error, body, headers){
		if (error) {
			console.log(error.message);
			return response.status(error["status-code"]).send(error.message);
		}
		console.log(body);
		//response.send(body, 200);
		response.status(200).send(body);
	});

	//update the db security object
	var usersecurity = couchnano.use(dbname);
	var json = {"admins":{"names":[],"roles":[]},"members":{"names":[useremail],"roles":[]}};
	usersecurity.insert(json, "_security", function(error, body, headers){
		if (error) {
			console.log("create user error");
			console.log(error.message);
			return response.status(error["status-code"]).send(error.message);
			//response.send(error.message, error["status-code"]);
		}
		console.log("no create error");
		console.log(body);
			
	});
	
}

exports.createNewUserDatabase = createNewUserDatabase;