'use strict';

var AV = require('leancloud-storage');
var async = require('async');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        console.log("UserName#  origin:"+origin);
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
}

var user_module = require('./lib/user-module');

// http request options
router.options('/', cors(corsOptions));
// http request method get
router.get('/', cors(corsOptions), function(req, res, next) {
    var UM = new user_module(req);
    AV.User.become(UM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function(){
        UM.typeCheck();
        return UM.getUserInfo('username')
    }).then(function (td) {
        var GroupResponse = [];
        td.forEach(function (currentValue) {
            GroupResponse.push(currentValue.toJSON());
        });
        res.status(200);
        res.send(GroupResponse);
    }).catch(function (error) {
        console.error('UserName# /user/name get error',error);
        res.status(error.code);
        res.send(error.message);
    })
});

// http request method put
router.put('/', cors(corsOptions), function(req, res, next) {
    var UM = new user_module(req);
    AV.User.become(UM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        return UM.updateOneUserName_ByName();
    }).then(function () {
        res.status(201);
        res.send("success, update user name successfully");
    }).catch(function (error) {
        console.error('UserName# /user/name put error',error);
        res.status(error.code);
        res.send(error.message);
    });
});


module.exports = router;