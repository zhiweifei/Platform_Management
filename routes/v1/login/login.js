'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var cors = require('cors');
var request=require('request');
var corsOptions = {
    origin: function(origin, callback){
        console.log("Login# origin:"+origin);
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
};
router.options('/', cors(corsOptions));
router.post('/', cors(corsOptions), function(req, res, next) {
    var username = req.body['username'];
    var password = req.body['password'];
    AV.User.logIn(username,password).then(function(user){
        var userinfo = user.toJSON();
        userinfo.sessionToken = user._sessionToken;
        console.log("Login# login success with user ", userinfo.username);
        res.status(200);
        res.send(userinfo);
    }).catch(function(err){
        console.error("Login# error",err);
        res.status(err.code == 1? 401:err.code);
        res.send(err.message.replace(/\[[^\)]*\]/g,""));
    })
});

module.exports = router;

