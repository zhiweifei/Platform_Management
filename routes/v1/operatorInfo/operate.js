/**
 * Created by dev03 on 2018/5/29.
 */
'use strict';

var AV = require('leanengine');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        console.log("operate#  origin:"+origin);
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
}

var operate_module = require('./lib/operate-module');


// http request options
router.options('/', cors(corsOptions));

router.get('/', cors(corsOptions), function(req, res, next) {
    var OM = new operate_module(req);
    AV.User.become(OM.sessionToken).catch(function () {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function(){
        OM.typeCheck();
        return OM.getNodeIds();
    }).then(function (idRanges) {
        return OM.OperatorInfoQuery(idRanges)
    }).then(function (result) {
        console.log('result',result)
        var alarmResponse = [];
        result.forEach(function (currentValue) {
            var usefulMessage = currentValue.toJSON();
            usefulMessage.Node = usefulMessage.Node.nodeId;
            alarmResponse.push(usefulMessage);
        });
        res.status(200);
        res.send(alarmResponse);
    }).catch(function (error) {
        console.error('operatorInfo /operatorInfom/get #error',error);
        res.status(error.code);
        res.send(error.message);
    })
});

router.put('/', cors(corsOptions), function(req, res, next) {
    console.log('test req.body',req.body);
    var OM = new operate_module(req);
    AV.User.become(OM.sessionToken).catch(function (error) {
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        OM.typeCheck();
        return OM.updateNodeInfo();
    }).then(function () {
        res.status(201);
        res.send("update operatorInfo successfully");
    }).catch(function (error) {
        console.error('operatorInfo /operatorInfo/put #error',error);
        res.status(error.code);
        res.send(error.message);
    });
});



module.exports = router;