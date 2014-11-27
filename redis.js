module.exports = function(Q) {
  var R = require("redis"),
    client = R.createClient();
  client.on("error", function(err) {
    console.log("error event - " + client.host + ":" + client.port + " - " + err);
  });
  
  var ret = {};
  
  ret.Set = function(key, val) {
    var d = Q.defer();
    client.set(key, val, function(err, ret) {
      if (err) {
        console.log("Err hmset", key, val, err);
        d.reject(err);
      } else d.resolve(ret);
    });
    return d.promise;
  };

  ret.Get = function(key) {
    var d = Q.defer();
    client.get(key, function(err, ret) {
      if (err) {
        console.log("Err get", key, err);
        d.reject(err);
      } else d.resolve(ret);
    });
    return d.promise;
  };

  ret.Hgetall = function(key) {
    var d = Q.defer();
    client.hgetall(key, function(err, ret) {
      if (err) {
        console.log("Err hgetall", key, err);
        d.reject(err);
      } else d.resolve(ret);
    });
    return d.promise;
  };
  
  ret.Lpush = function(key, val) {
    var d = Q.defer();
    client.lpush(key, val, function(err, ret) {
      if (err) {
        console.log("Err lpush", key, val, err);
        d.reject(err);
      } else d.resolve(ret);
    });
    return d.promise;
  };  
  
  ret.Lget = function(key) {
    var d = Q.defer();
    client.lrange(key, 0,-1, function(err, ret) {
      if (err) {
        console.log("Err Lget", key, val, err);
        d.reject(err);
      } else d.resolve(ret);
    });
    return d.promise;
  };  
  
  ret.Incr = function(key) {
    var d = Q.defer();
    client.incr(key, 1, function(err, ret) {
      if (err) {
        console.log("Err incr", key, val, err);
        d.reject(err);
      } else d.resolve(ret);
    });
    return d.promise;
  };  
  
  ret.newID = function(){
    var d = new Date().getTime();
    var uuid = 'xyxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  };

  return ret;
};