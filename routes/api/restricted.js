'use strict'
const jwt = require('express-jwt');
const config = require('../../config.json');

module.exports = function(router) {
    //allow requests with valid jwt only
    router.use('*',jwt({secret:config.jwt_secret}));
    
    router.get('/', function(req,res) {
        res.json({token: req.user});
    });
}