'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var cors = require('cors');
var corsOptions = {
    origin: function(origin, callback){
        console.log("UserAuthData# origin:"+origin);
        var originIsWhitelisted = true;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
};

router.options('/', cors(corsOptions));
router.post('/', cors(corsOptions), function(req, res, next) {
    var authPlatform = req.body["authPlatform"];
    var openid = req.body["openid"];
    var access_token = req.body["access_token"];
    var expires_in = req.body["expires_in"];
    AV.User.loginWithAuthData({
          openid: openid,
          access_token: access_token,
          expires_in: expires_in
    }, authPlatform).then(function(user) {
        var userinfo = user.toJSON();
        userinfo.sessionToken = user._sessionToken;
        console.log("UserAuthData# login success with user ", userinfo.username);
        res.status(200);
        res.send(userinfo);
    }).catch(function(err) {
        console.error("UserAuthData# error",err);
        res.status(err.code);
        res.send(err.message);
    });
});

module.exports = router;

