/**
 * Created by dev03 on 2018/5/25.
 */
var config = require('../config.json');
var crypto = require('crypto');
var request = require('request');
var querystring = require('querystring');

var simboss = function() {

    var that = this;
    this.init = {
        "appid" : config.AppID,
        "timestamp" : Math.round(new Date().getTime())
    };
    this.secret = config.AppSecret;
    this.paramSort = function (paramJson) {
        var reqParam = that.init;
        reqParam = Object.assign(reqParam,paramJson);
        var reqParamArray = Object.keys(reqParam);
        reqParamArray.sort();
        var reqSortJson = {};
        reqParamArray.forEach(function (current) {
            reqSortJson[current] = reqParam[current]
        });
        return reqSortJson;
    }

    this.encrypt = function(reqSortJson){
        console.log('that.secret',that.secret)
        var encryptParam = querystring.stringify(reqSortJson) + that.secret;
        return crypto.createHash('sha256').update(encryptParam).digest('hex');
    }

    this.reqSimboss = function(url,req,callback){
        console.log('url req','https://api.simboss.com' + url,querystring.stringify(req));
        request({
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            url: 'https://api.simboss.com' + url,
            json: true,
            body: querystring.stringify(req)
        }, function(err, res, body) {
            if (err) {
                console.error('get simboss Bandwidth Usage error # ',err);
            } else {
                console.log("get simboss Bandwidth Usage #" , body);
                callback(body)
            }
        });
    }

}
module.exports = simboss;
