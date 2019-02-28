'use strict'
const User = require('../../models/User.js');
const validate = require('express-validation');
const joi = require('joi');
const config = require('../../config.json');
const jwtSigner = require('jsonwebtoken');

const loginValidation = {
    body: {
        email: joi.string().email().required(),
        password: joi.string().required()
        
    }
}

module.exports = function(router) {
    
    router.post('/login', validate(loginValidation), function(req,res,next) {
        let email = req.body.email;
        let password = req.body.password;
        let response = {};
        if(User.authorizeUser(email,password)) {
            response.authorized = true;
            //create a login token
            let token = jwtSigner.sign({user:email}, config.jwt_secret);
            response.token = token;
        } else {
            response.authorized = false;
        }
        res.json(response);
    })
}