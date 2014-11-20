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

app.get('/', function(req, res) {
    res.render('welcome', {
        'massage': ''
    });
});

app.get('/*', function(req, res) {
    res.render('welcome', {
        'massage': ''
    });
});

/*-----------------------Socket Connection-------------------------------*/
app.userCount = 0;
io.on('connection', function(socket) {
  console.log('userCount:',app.userCount++ + 1,Date());
    socket.on('disconnect', function() {
      console.log('userCount:',app.userCount-- - 1,Date());
    });

    socket.on('addQA', function(data) {
        var inp = JSON.parse(data);
        redis.Get('QA:' + inp.name).then(function(qa) {
            if (qa) {
                socket.emit('validated', '0');
                return 0;
            } else {
                  redis.Set('QA:' + inp.name, {}).then(function() {
                        socket.emit('validated', '1');
                    });
            }
        });
    });
});
/*---------------------------------------------------------------------------*/

http.listen(3000, function() {
    console.log('listening on *:3000');
})
