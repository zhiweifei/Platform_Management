/**
 * Created by dev03 on 2018/4/10.
 */
'use strict';

var AV = require('leancloud-storage');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        console.log("User#  origin:"+origin);
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
        return UM.getUserInfo()
    }).then(function (td) {
        var GroupResponse = [];
        td.forEach(function (currentValue) {
            GroupResponse.push(currentValue.toJSON());
        });
        res.status(200);
        res.send(GroupResponse);
    }).catch(function (error) {
        res.status(error.code);
        res.send(error.message);
    })
});

// http request method post
router.post('/', cors(corsOptions), function(req, res, next) {
    var UM = new user_module(req);
    UM.typeCheck();
    UM.buildAllUser().then(function () {
        res.status(201);
        res.send("success, build up new User successfully");
    }).catch(function (error) {
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
        return UM.updateUser_personal_Info();
    }).then(function () {
        res.status(201);
        res.send("success, update user Info successfully");
    }).catch(function (error) {
        res.status(error.code);
        res.send(error.message);
    });
});

// http request method delete
router.delete('/', cors(corsOptions), function(req, res, next) {
    var UM = new user_module(req);
    AV.User.become(UM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        UM.typeCheck();
        return UM.deleteAllUser()
    }).then(function () {
        res.status(204);
        // response get null
        res.send("success, delete user successfully");
    }).catch(function (error) {
        res.status(error.code);
        res.send(error.message);
    });
});


module.exports = router;