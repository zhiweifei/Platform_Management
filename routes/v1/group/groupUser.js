'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var cors = require('cors');
var request=require('request');
var corsOptions = {
	origin: function(origin, callback){
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
        GM.paramsCheck();
        GM.typeCheck();
        return GM.getGroupByname()
    }).then(function (group) {
        return GM.getMidGroupUser(group)
    }).then(function(users){
        res.status(200);
        res.send(users);
    }).catch(function (error) {
        console.error('GroupUser# get error',error);
        res.status(error.code);
        res.send(error.message);
    })

});
module.exports = router;

