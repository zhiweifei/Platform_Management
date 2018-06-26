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

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
router.options('/', cors(corsOptions));
router.post('/', cors(corsOptions), function(req, res, next) {
    var openid = req.body['openid'];
    var access_token = req.body['access_token'];
    var X_LC_Id = req.headers['x-lc-id'];
    var X_LC_Sign = req.headers['x-lc-sign'];
    var body = {
        "openid": openid,
        "access_token": access_token,
        "expires_in": 1893456000
    };
    var url = 'https://' + X_LC_Id.slice(0,7) + '.api.lncld.net/1.1/login';
    request({
        headers:{
            "Content-Type": "application/json",
            "X-LC-Id": X_LC_Id,
            "X-LC-Sign": X_LC_Sign
        },
        url: url,
        method: "POST",
        json: true,
        body: body
    }, function(error, response, body) {
        res.status(response.statusCode);
        res.send(body);
    });
});

module.exports = router;

