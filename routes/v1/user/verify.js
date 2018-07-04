'use strict';

var AV = require('leancloud-storage');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        console.log("UserVerify#  origin:"+origin);
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
}

var user_module = require('./lib/user-module');

// http request options
router.options('/', cors(corsOptions));
// http request method post
router.post('/', cors(corsOptions), function(req, res, next) {
    var UM = new user_module(req);
    AV.User.become(UM.sessionToken).then(function(user){
        UM.user = user;
    }).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        return UM.verifyEmailPhone();
    }).then(function () {
        res.status(201);
        res.send("success, verify email or phone success");
    }).catch(function (error) {
        console.error('UserVerify #/user/verify put error',error);
        res.status(error.code);
        res.send(error.message);
    });
});


module.exports = router;