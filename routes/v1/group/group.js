'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var cors = require('cors');
var request=require('request');
var corsOptions = {
	origin: function(origin, callback){
		console.log("Group# origin:"+origin);
		var originIsWhitelisted = true;
		callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
	}
};
var group_module = require('./lib/group-module');

router.options('/', cors(corsOptions));

router.get('/', cors(corsOptions), function(req, res, next) {
    var GM = new group_module(req);
    AV.User.become(GM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function(){
        GM.typeCheck();
        return GM.getGroup()
    }).then(function (td) {
        var GroupResponse = [];
        td.forEach(function (currentValue) {
            GroupResponse.push(currentValue.toJSON());
        });
        res.status(200);
        res.send(GroupResponse);
    }).catch(function (error) {
        console.error('#Group# get error',error);
        res.status(error.code);
        res.send(error.message);
    })

});

router.post('/', cors(corsOptions), function(req, res, next) {
    var GM = new group_module(req);
    AV.User.become(GM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        GM.typeCheck();
        return GM.buildAllGroup();
    }).then(function () {
        res.status(201);
        res.send("success, relate to users successfully");
    }).catch(function (error) {
        console.error('Group# post error',error);
        res.status(error.code);
        res.send(error.message);
    })
});

router.put('/', cors(corsOptions), function(req, res, next) {
    var GM = new group_module(req);
    AV.User.become(GM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        GM.typeCheck();
        return GM.updateAllGroup();
    }).then(function () {
        res.status(201);
        res.send("success, update group Info successfully");
    }).catch(function (error) {
        console.error('Group# put error',error);
        res.status(error.code);
        res.send(error.message);
    });
});

router.delete('/', cors(corsOptions), function(req, res, next) {
    var GM = new group_module(req);
    AV.User.become(GM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        GM.typeCheck();
        return GM.deleteAllGroup()
    }).then(function () {
        res.status(204);
        // response get null
        res.send("success, delete group successfully");
    }).catch(function (error) {
        console.error('Group# delete error',error);
        res.status(error.code);
        res.send(error.message);
    });
});

module.exports = router;

