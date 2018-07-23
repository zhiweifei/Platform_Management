/**
 * Created by dev03 on 2018/6/7.
 */

var AV = require('leanengine');
var router = require('express').Router();
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        console.log("AccessLink-Platform_Management device management nodeInfo#  origin:"+origin);
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
}

var nodeInfo_module = require('./lib/node-module');


// http request options
router.options('/', cors(corsOptions));

router.get('/', cors(corsOptions), function(req, res, next) {
    var NM = new nodeInfo_module(req);
    AV.User.become(NM.sessionToken).catch(function(){
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function(){
        NM.typeCheck();
        return NM.getNodeIds().then(function(idRanges){
            return NM.nodeInfoQuery(idRanges)
        })
    }).then(function (result) {
        var nodeInfoResponse = [];
        result.forEach(function (currentValue) {
            var currentJsonObject = currentValue.toJSON();
            currentJsonObject.Group = currentJsonObject.Group.name;
            nodeInfoResponse.push(currentJsonObject);
        });
        res.status(200);
        res.send(nodeInfoResponse);
    }).catch(function (error) {
        console.error('AccessLink-Platform_Management device management /node/get #error',error);
        res.status(error.code);
        res.send(error.message);
    });
});

router.post('/', cors(corsOptions), function(req, res, next) {
    var NM = new nodeInfo_module(req);
    AV.User.become(NM.sessionToken).catch(function(){
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        NM.typeCheck();
        return NM.buildUpNewNode();
    }).then(function () {
        res.status(201);
        res.send('build nodeInfo successfully');
    }).catch(function (error) {
        console.error('AccessLink-Platform_Management device management /node/put #error',error);
        res.status(error.code);
        res.send(error.message);
    });
});

router.put('/', cors(corsOptions), function(req, res, next) {
    var NM = new nodeInfo_module(req);
    AV.User.become(NM.sessionToken).catch(function(){
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        NM.typeCheck();
        return NM.updateAllNode();
    }).then(function () {
        res.status(201);
        res.send('update nodeInfo successfully');
    }).catch(function (error) {
        console.error('AccessLink-Platform_Management device management /node/put #error',error);
        res.status(error.code);
        res.send(error.message);
    });
});

router.delete('/', cors(corsOptions), function(req, res, next) {
    var NM = new nodeInfo_module(req);
    AV.User.become(NM.sessionToken).catch(function(){
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function() {
        NM.typeCheck();
        return NM.deleteAllNode();
    }).then(function () {
        res.status(204);
        res.send({
            "res":"success, delete NodeInfo successfully"
        });
    }).catch(function (error) {
        console.error('AccessLink-Platform_Management device management /node/delete #error',error);
        res.status(error.code);
        res.send(error.message);
    });
});


module.exports = router;