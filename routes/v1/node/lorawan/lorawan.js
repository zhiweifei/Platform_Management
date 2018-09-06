/**
 * Created by dev03 on 2018/6/7.
 */
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

var nodeInfo_module = require('../lib/node-module');

// http request options
router.options('/', cors(corsOptions));

router.get('/', cors(corsOptions), function(req, res, next) {
    var NM = new nodeInfo_module(req);
    AV.User.become(NM.sessionToken).catch(function(){
        throw new AV.Error(401,'Invalid SessionToken');
    }).then(function(){
        return NM.getOneFiledInfo('LoRaWAN')
    }).then(function (td) {
        var LoRaWANResponse = [];
        td.forEach(function (currentValue) {
            LoRaWANResponse.push(currentValue.toJSON());
        });
        res.status(200);
        res.send(LoRaWANResponse);
    }).catch(function (error) {
        console.error('AccessLink-Platform_Management device management# /node/nodeId #error',error);
        res.status(error.code);
        res.send(error.message);
    });
});



module.exports = router;