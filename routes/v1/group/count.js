'use strict';
var AV = require('leanengine');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
}

var group_module = require('./lib/group-module');


// http request options
router.options('/', cors(corsOptions));

router.get('/', cors(corsOptions), function(req, res, next) {
	console.log("group count")

    var GM = new group_module(req);
    AV.User.become(GM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function(){
        return GM.getGroupCount()
    }).then(function (td) {
        res.status(200);
        res.send({count:td});
    }).catch(function (error) {
        console.error('"GroupCount# get error',error);
        res.status(error.code);
        res.send(error.message);
    })
});


module.exports = router;