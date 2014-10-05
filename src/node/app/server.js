var express = require("express");
var session = require('express-session')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var RedisStore = require("connect-redis")(session);
//var store = new express.session.MemoryStore;
var app = express();
//var redis = require("redis").createClient();
var requestHandlers = require("./requestHandlers");
var couchDbUrl = "http://localhost:5984";
var sessionSecret = "mysecret1235";


 
//CORS Middleware
var allowCrossDomain = function(request,response,next){

	var allowedHost = [
		"http://192.168.0.167:8888",
		"http://127.0.0.1:8000"
	];
	console.log("processing access control:" + request.headers.host);
	if (allowedHost.indexOf(request.headers.host) !== -1)
		//response.header("Access-Control-Allow-Origin", request.headers.host);//change this to specific host on prod. Check nodejs app.configure. www.backbonetutorials.com/cross-domain-sessions/
	
	response.header("Access-Control-Allow-Credentials", "true");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");
	response.header("Access-Control-Expose-Headers", "Set-Cookie");
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	next();
}

//Configure
//TODO: enable environment specific config. look into process.env.NODE_ENV	
app.use(allowCrossDomain);
app.use(bodyParser());
app.use(cookieParser());
app.use(session({secret: sessionSecret, store: new RedisStore, cookie: {httpOnly: false}}));

//API Routes
/*
//replaced with Middleware config
app.all("/*", function(request,response,next){
	console.log("processing access control");
	response.header("Access-Control-Allow-Origin", "http://192.168.216.167:8888/ http://0.0.0.0:8000/");//change this to specific host on prod. Check nodejs app.configure. www.backbonetutorials.com/cross-domain-sessions/
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With");
	next();
});
*/

app.get("/test1/:get1", requestHandlers.test1);
app.post("/api/user/signup", requestHandlers.signupUser);


app.post('/api/user/signin', function (req, res) {
    console.log("Session:");
    console.log("Auth deets:"+ req.body.name + "," + req.body.password);
    
    var nano = require('nano')({ url : couchDbUrl});
    var	username = req.body.name;
    var	userpass = req.body.password;
//var username = "test4";
//var userpass = "test";
 //req.session.username = username;
 //redis.set("username", username);
 //redis.set("sid", req.session.id); 

    nano.request({
            method: "POST",
            db: "_session",
            form: { name: username, password: userpass },
            content_type: "application/x-www-form-urlencoded; charset=utf-8"
        },
        function (err, body, headers) {
          //console.log(headers['set-cookie']);
            if (err) { res.send(err.reason); return; }
            

            console.log(headers['set-cookie']);
            if (headers['set-cookie']){
            	res.cookie(headers['set-cookie']);
            }
            
            //res.send('Logged in!');
            console.log(body);
            res.send(body);
        });
});

app.get('/api/couchdb/testCouchSession', function (req, res) {
	console.log("Auth Cookie:" + req.cookies['AuthSession']);
	var authCookie = req.cookies['AuthSession']; 
	
	if (!authCookie) {res.send(401); return;}
	var nano = require('nano')({ url : couchDbUrl, cookie: "AuthSession=" + authCookie});
	nano.request({
	    method: "GET",
	    db: "_session",
	    content_type: "application/x-www-form-urlencoded; charset=utf-8"
	},
	function (err, body, headers) {
	  //console.log(headers['set-cookie']);
	    if (err) { res.send(err.reason); return; }

	    console.log(body);
	    //res.send(headers['set-cookie']);
	    res.send(body);
	});
});

//testing routes.
/*
app.get('/api/user/authset/:value', function (req, res) {
	console.log(req);
	console.log("signed cookie.sid:" + req.signedCookies["connect.sid"]);
	console.log("session id:" + req.sessionID);
	req.session.auth = req.params.value;
	console.log("session test:" + req.session.auth);
	res.send("authset:" + req.params.value + "\n");
});

app.get('/api/user/verify', function (req, res) {
	console.log("session test:" + req.session.auth);
	console.log("signed cookie.sid:" + req.signedCookies["connect.sid"]);
	
	console.log("headers:" + req.headers.cookie);
	
	res.send("verify:" +  req.session.auth + "\n");
});

app.get('/api/docs/listall/:databasename', function(req, res){
	var authCookie = req.cookies['AuthSession']; 
	if (!authCookie) {res.send(401); return;}
	var nano = require('nano')({ url : couchDbUrl, cookie: "AuthSession=" + authCookie});
	var database = req.params.databasename;
	
	nano.request({
		method: "GET",
		db: database
	},
	function (err, body, headers) {
		if (err) { res.send(err.reason); return; }
		
		res.send(body);
	});
});
*/

app.listen(8888);
console.log("Server has started.");