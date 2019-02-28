'use strict'
const config = require('../../config.json');
const jwt = require('express-jwt');

module.exports = function (router) {
    //allow requests with valid jwt only
   
    //router.use('*', jwt({ secret: config.jwt_secret }))

    router.get('/', (req, res, next) => {
        //twilio token
        // const accountSid = process.env.TWILIO_SID || config.twilio_sid;
        // const authToken = process.env.TWILIO_AUTH_TOKEN || config.twilio_auth_token;
         const accountSid = config.twilio_sid;
         const authToken = config.twilio_auth_token;
         const client = require('twilio')(accountSid, authToken);

        client.tokens.create().then(twilioRes => {
            var result = {}
            result = {
                'ice_servers': [
                  {
                    'url': 'turn:104.214.239.141:3478?transport=udp',
                    'username': 'user',
                    'credential': 'Passw0rd'
                  },
                  {
                    'url': 'turn:104.214.239.141:3478?transport=tcp',
                    'username': 'user',
                    'credential': 'Passw0rd'
                  }
                ]
              }
            //result.ice_servers = twilioRes.iceServers
            res.json(result)
        }).done();
    })
}
