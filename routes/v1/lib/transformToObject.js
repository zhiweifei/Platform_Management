'use strict';
var AV = require('leanengine');
var async = require('async');
var transformToObject = function (ArrParam,table,field,sessionToken) {
    return new Promise(function (resolve,reject) {
        async.map(ArrParam, function (value, callback) {
            var Query = new AV.Query(table);
            Query.equalTo(field, value);
            Query.find({'sessionToken':sessionToken}).then(function (result) {
                console.log('transformToObject #result object', result);
                callback(null, result);
            });
        }, function (err, result) {
            if (err != null) {
                reject(err);
            }
            else {
                var allObject = [];
                result.forEach(function (current) {
                    allObject = allObject.concat(current)
                });
                resolve(allObject);
            }
        });
    })
};
module.exports = transformToObject;