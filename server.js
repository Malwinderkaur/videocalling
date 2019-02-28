const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');
const morgan = require('morgan');
const enrouten = require('express-enrouten');
const ev = require('express-validation');
const jwt = require('jsonwebtoken')
const config = require('./config.json')
const expressjwt = require('express-jwt');

// assign options for express validation 
ev.options({ flatten: true });

//log requests
app.use(morgan('short'));

// parse application/json
app.use(bodyParser.json());

//disable x-powered-by (recommended best practice)
app.disable('x-powered-by');

//serve the public folder directly
app.use(serveStatic('public'));

//use the enrouten module to configure routes. No need to add routes manually. The specified folder is scanned for handlers
app.use(enrouten({ directory: 'routes' }))

app.get('/expertsonline',expressjwt({secret:config.jwt_secret}), (req,res) => {
    res.json(expertsonline)
})

/* ERROR HANDLERS */
//configure error handlers
//express returns development if NODE_ENV is not set

//err handler. no stack trace is leaked to the user in prod run
app.use(function (err, req, res, next) {
    console.log('Error: ' + err);
    let errResponse = {};
    if (app.get('env') === 'development') {
        //development mode
        errResponse.message = err.message;
        errResponse.stack = err.stack;
    } else {
        //production. no stack trace
        errResponse.message = err.message;
    }
    //express-validation error
    if (err instanceof ev.ValidationError) {
        errResponse.message += err;
    }
    
    //express-jwt error handling
    if (err.name === 'UnauthorizedError') {
        err.status = 401;
        errResponse.message = 'Unauthorized User';
    }

    res.status(err.status || 500);
    res.json(errResponse);

});

/* START LISTENING FOR CONNECTIONS */
const https = require('https')
const fs = require('fs')

var server = https.createServer({
  key: fs.readFileSync('KroschuVideoCall.key'),
  cert: fs.readFileSync('KroschuVideoCall.crt')
}, app).listen(3000, () => {
  console.log('Listening...')
})
var port = process.env.PORT || 3000;
//var server = app.listen(port, function () {
  //  console.log(`App listening on port ${port}. NODE_ENV ${process.env.NODE_ENV}. app.get('env') ${app.get('env')}.`);
//});

/**
 * Socket code
 */
//dict of userid: socketid
var expertsonline = {}
const io = require('socket.io').listen(server);

const event_expertsonline = 'expertsonline'
const event_privatemessage = 'privatemessage'

//The socket will notify the server whether it is being made via a webclient.
//Experts will connect via webclients only
io.sockets.on('connection', function(socket){
    let token = socket.handshake.query.token
    let webclient = socket.handshake.query.webclient
    console.log('a user connected', token,webclient );
    console.log(socket);

    //allow connection only if this is a valid token
    jwt.verify(token,config.jwt_secret, function(err,decoded) {
        if(err) {
            console.log('unknown token')
            socket.disconnect()
        } else {
            console.log(decoded)
            //create a room for this socket (name same as user prop in token)
            // socket.join(decoded.user, () => {
                
            // })
            //add self to list of available users
            if(webclient) {
                expertsonline[socket.id] = decoded.user
            }
            
            //broadcast this list to all connected clients
            io.emit(event_expertsonline,expertsonline)
        }
    })

    socket.on('disconnect', function(){
      console.log('user disconnected');
      delete expertsonline[socket.id]
      //expert list changed, emit
      io.emit(event_expertsonline,expertsonline)
    })

    socket.on(event_privatemessage, (data) => {
        //3 fields must be present: event (str), to (socketid), payload (obj)
        const receiver = data.to
        const sender = socket.id
        const event = data.event
        const payload = data.payload
        if(receiver) {
            console.log("PM: ", sender, receiver, event, payload)
            io.to(receiver).emit(event,{
                sender:sender,
                payload:payload
            })
        } else {
            console.log("PM failed, receiver not mentioned", sender, event,payload)
        }
        
    })


  });