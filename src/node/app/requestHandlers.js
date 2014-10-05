var couchDbHandlers = require("./couchDbHandlers");

function test1(request,response){
	var get1 = request.params.get1;
	response.send("test1["+ get1 +"]");
}


function signupUser(request,response){
	var useremail = request.body.email;
	var userpassword = request.body.password;
	var databasename = useremail;
	console.log("Signup with email["+ useremail +"], password["+ userpassword +"]");
	
	couchDbHandlers.createNewUserDatabase(databasename,useremail,userpassword, response);
	
	//response.send("Signup with email["+ useremail +"], password["+ userpassword +"]");
}

exports.signupUser = signupUser;
exports.test1 = test1;