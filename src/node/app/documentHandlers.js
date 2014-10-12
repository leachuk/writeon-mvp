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
    var db = couchnano.use("db_app_document");
    var docname = req.params.name;
    var fieldparam = req.query.field;
    var valueparam = req.query.value;
    console.log("node params. field["+ fieldparam +"], value["+ valueparam +"]");
    var returnbody = null;
    db.atomic("example",
        "in-place",
        docname,
        [{field: fieldparam, value: valueparam},{field: "field2", value: "field2foo"}],
        function (error, response) {
            if (error) {
                console.log("update error");
            }else{
                returnbody = response;
                console.log("update worked:");
                console.log(response);
            }
        });
    
    res.send(returnbody);
//    db.update = function(obj, key, callback) {
//     var db = this;
//     db.get(key, function (error, existing) { 
//      if(!error) obj._rev = existing._rev;
//      db.insert(obj, key, callback);
//     });
//    }
//    
//    db.update({title: 'The new one 3'}, docname, function(err, res) {
//     if (err) return console.log('No update!');
//     console.log('Updated!');
//    });
//    res.send("saved \n");
}

exports.saveDocument = saveDocument;