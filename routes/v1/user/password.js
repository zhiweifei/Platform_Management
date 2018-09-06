'use strict';

var AV = require('leancloud-storage');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
}

var user_module = require('./lib/user-module');

// http request options
router.options('/', cors(corsOptions));
// http request method put
router.put('/', cors(corsOptions), function(req, res, next) {
    var UM = new user_module(req);
    AV.User.become(UM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        UM.paramCheck();
        UM.typeCheck();
        return UM.updateUserPassword();
    }).then(function () {
        res.status(201);
        res.send("success, update user password successfully");
    }).catch(function (error) {
        console.error('UserPassword #/user/password put error',error);
        res.status(error.code);
        res.send(error.message);
    });
});


module.exports = router;