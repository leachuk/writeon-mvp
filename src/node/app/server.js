var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var RedisStore = require("connect-redis")(session);
//var store = new express.session.MemoryStore;
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var nconf = require("nconf");
nconf.argv().env()
            .file({ file: "../config/config-dev.json" });

var app = express();

//custom objects
var documentHandlers = require("./documentHandlers");
var requestHandlers = require("./requestHandlers");
var couchDbUrl = "http://" + nconf.get("config.couchdb.hostname") + ":" + nconf.get("config.couchdb.port");
var sessionSecret = "mysecret1235";


//CORS Middleware. Still needed??
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
//testing functions and data, to be replaced.
var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

//Configure
//TODO: enable environment specific config. look into process.env.NODE_ENV
app.use(allowCrossDomain);
app.use(bodyParser());
app.use(cookieParser());
app.use(session({secret: sessionSecret, store: new RedisStore, cookie: {httpOnly: false}}));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
//passport strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));
//configure views
app.set('views', __dirname + '/../views');
app.set('view engine', 'jade');
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


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

// POST /login
//   This is an alternative implementation that uses a custom callback to
//   acheive the same functionality.
//   curl -v -d "username=bob&password=secret" http://localhost:8888/logintest
app.post("/logintest", function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.session.messages =  [info.message];
      return res.send("not authenticated. Try again.\n");
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.send("authenticated. Hurrah.\n");
    });
  })(req, res, next);
});

app.get("/test1/:get1", requestHandlers.test1);

app.post("/api/user/signup", requestHandlers.signupUser);

app.post("/api/user/signin", function (req, res) {
    console.log("Session:");
    console.log("Auth deets:"+ req.body.name + "," + req.body.password);
    
    var nano = require("nano")({ url : couchDbUrl});
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

//DOCUMENT SPECIFIC ROUTES
app.put("/api/docs/save/document/:name", documentHandlers.saveDocument);
app.get("/api/docs/list/database/:db", documentHandlers.listDocument);
app.get("/api/responsetest", documentHandlers.responseTest);


app.listen(8888);
console.log("Server has started.");