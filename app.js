var Q = require("q");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var os = require("os");
var redis = require('./redis')(Q);

app.use(express.static(__dirname + '/scripts'));
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

/*---------------Routers--------------------------------------*/

app.get('/join/:qaName', function(req, res) {
  redis.Get('QAname:'+req.params.qaName).then(function(key){
    redis.Get('QA:'+key).then(function(variables){
      res.render('join', {
        name : req.params.quName,
        variables: variables 
      });       
    })
  }).fail(function(e){
        res.render('error', {
          e : e
        });  
      })
});

app.get('/*', function(req, res) {
    res.render('welcome', {
        'massage': '',
        'url': req.protocol + '://' + req.get('host'),
    });
});

app.get('/admin/:key', function(req, res) {
    res.render('main', {
        'massage': '',
        'url': req.protocol + '://' + req.get('host'),
        'startAt' : 'welcome'
    });
});


/*-----------------------Socket Connection-------------------------------*/

app.userCount = 0;
io.on('connection', function(socket) {
  console.log('userCount:',app.userCount++ + 1,Date());
  socket.emit('connect','1');
  socket.on('disconnect', function() {
    console.log('userCount:',app.userCount-- - 1,Date());
  });
  
  socket.on('join',function(room){
    socket.join(room);
    socket.emit('join');
    console.log("join in:",room);
    io.to(room).emit('answers',JSON.stringify({a: 'uri'}));
  });

  socket.on('dispatch',function(qKey){
    redis.get('Q:'+qKey).then(function(q) {
      if (!q) socket.emit('dispatch','0');
      else {
        room = JSON.parse(q).key;
        io.to(room).emit('getQ',q);
        socket.emit('dispatch','1');
      }
    });
  })
  
  socket.on('answer',function(data){
    var inp = JSON.parse(data);
    var qKey = inp.qKey,
      answer = inp.answer,
        user = inp.user;
    var ans = JSON.stringify({user : user, answer : answer})
    if(!qKey || !answer) socket.emit('answered','0');  
    redis.Lpush('A:'+qKey,ans).then(function(){
      io.broadcast.to(qKey).emit('answers',ans);
      redis.Lget('A:'+qKey,function(all_available_answers){
        socket.emit('answers',JSON.stringify(all_available_answers));
      });
    },function(e) {
      socket.emit('answered','0');  
    });
  })
  
  socket.on('addQA', function(data) {
    var inp = JSON.parse(data);
    var variables  = initQA(inp);
    var newid = redis.newID()
    if (!variables) {
      socket.emit('addQA', JSON.stringify({result : '0', why : "could not init QA"}));
      return 0;
    }  
    redis.Get('QAname:' + inp.name).then(function(qa) {
      if (qa) {
        socket.emit('addQA', JSON.stringify({result : '0', why : 'QA name allready exists'}));
      } else {
        redis.Set('QAname:'+inp.name,newid).then(function(){
          redis.Set('QA:' + newid, JSON.stringify(variables)).then(function() {
            socket.emit('addQA', JSON.stringify({result : '1',qa : variables}));
          },function(e){
            console.log(e);
            socket.emit('addQA', JSON.stringify({result : '0', why : 'Failed to insert Qa to the database'}));
          });
        });
      }
    });
  });

  socket.on('addQ', function(data) {
    console.log("addQ:",data);
    var inp = JSON.parse(data);
    var newid,
        key;
    getQAKey(inp.qaName).then(function(key) {
      this.key = key;
      newid = redis.newID()
      var order = new Date().getTime().toString();
      var obj = {key : newid, q : inp.q , qa : key, order : order};
      return redis.Set('Q:'+newid,JSON.stringify(obj))
    }).then(function(ret) {
        if(ret === null) throw new Error("Could not set a Q");
      return redis.Lpush('QAQ:' + key, newid);
    }).then(function(ret) {
          if (ret === null) throw new Error("Could not push Q to Q");
          socket.emit('addQ','1');
        },function(e){
          socket.emit('addQ','0');
          console.log("error with addQ:",e);
        });
      
  });


}); // end socket listeners

 
     
  
function initQA(variables) {
  if (!variables.name) return 0;
    variables.time = variables.time || 20;
    variables.showUsers = variables.showUsers || true;
    return variables;    
}

function getQAKey(qaName){
  d = Q.defer();
  if(!qaName) d.reject(new Error("Stop Hacking Me!!"));
  redis.Get('QAname:' + qaName).then(function(key) {
    if(key === null) d.reject(new Error("No QA was found"));
    else 
        d.resolve(key);
    });
  return d.promise;  
}
/*---------------------------------------------------------------------------*/


http.listen(3000, function() {
    console.log('listening on *:3000');
})
