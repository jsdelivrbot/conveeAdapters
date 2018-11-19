var JsonDB = require('node-json-db');

var enableLogs = true;
var TAG="KVS#"

// The second argument is used to tell the DB to save after each push
// If you put false, you'll have to call the save() method.
// The third argument is to ask JsonDB to save the database in an human readable format. (default false)
var db = new JsonDB("userDatabase", true, true);

/**
 * insert object in database
 * @param {*} key 
 * @param {*} value 
 */
var set = function (key, value) {
    try {
        db.push("/"+key, value);
        if (enableLogs)
            console.log(TAG+"Inserted Key:" + key + "\nvalue:" + JSON.stringify(value));
    } catch (error) {
        console.error(TAG+error);
    };

}

/**
 * get object by key from database
 * @param {*} key 
 */
var get=function(key){
var data=null;
    try {
       data=db.getData("/"+key);
        if (enableLogs)
            console.log(TAG+" Get Key:" + key + "\nvalue:" + JSON.stringify(data));
    } catch (error) {
        // The error will tell you where the DataPath stopped
       // console.error(error);
    };
return (data=={}||data==null)?null:data;
}

/**
 * Remove object by key in database
 * @param {*} key 
 */
var remove = function(key){
        try {
            db.delete("/"+key);
            if (enableLogs)
                console.log(TAG+"Removed Key:" + key);
        } catch (error) {
            console.error(error);
        };
}

module.exports={
    set:set,
    get:get,
    remove:remove
}

