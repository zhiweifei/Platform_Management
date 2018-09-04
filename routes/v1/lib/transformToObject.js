'use strict';
var AV = require('leanengine');
var async = require('async');
var transformToObject = function (ArrParam,table,field,sessionToken) {
    var Query = new AV.Query(table);
    Query.containedIn(field, ArrParam);
    return Query.find({'sessionToken':sessionToken}).then(function (result) {
        return result
    });
};
module.exports = transformToObject;