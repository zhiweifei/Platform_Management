/**
 * Created by dev03 on 2018/4/10.
 */
'use strict';
var AV = require('leanengine');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        console.log("GroupName#  origin:"+origin);
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
}

var group_module = require('./lib/group-module');


// http request options
router.options('/', cors(corsOptions));

router.get('/', cors(corsOptions), function(req, res, next) {
    var GM = new group_module(req);
    AV.User.become(GM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function(){
        GM.typeCheck();
        return GM.getGroup('name')
    }).then(function (td) {
        var GroupResponse = [];
        td.forEach(function (currentValue) {
            GroupResponse.push(currentValue.toJSON());
        });
        res.status(200);
        res.send(GroupResponse);
    }).catch(function (error) {
        console.error('GroupName# get error',error);
        res.status(error.code);
        res.send(error.message);
    })
});


module.exports = router;