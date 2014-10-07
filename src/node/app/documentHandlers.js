//documentHandlers.js
//use these abstracted methods in the application so the backend can be more easily swapped out.
//currently using couchdb with nano wrapper.
var nconf = require("nconf");
nconf.argv().env()
            .file({ file: "../config/config-dev.json" });

var couchnano = require("nano")("http://" + nconf.get("config.couchdb.adminusername")
                                          + ":" + nconf.get("config.couchdb.adminpassword")
                                          + "@" + nconf.get("config.couchdb.hostname")
                                          + ":" + nconf.get("config.couchdb.port"));



function saveDocument(req,res){
    var articlesDb = couchnano.use("articles");
    var docname = req.params.name;
    
    articlesDb.update = function(obj, key, callback) {
     var db = this;
     db.get(key, function (error, existing) { 
      if(!error) obj._rev = existing._rev;
      db.insert(obj, key, callback);
     });
    }
    
    articlesDb.update({title: 'The new one 3'}, docname, function(err, res) {
     if (err) return console.log('No update!');
     console.log('Updated!');
    });
    res.send("saved \n");
}

exports.saveDocument = saveDocument;