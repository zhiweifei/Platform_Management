'use strict';
var ArrayFindDifference = function (oldArr,newArr) {
    var addArr = [];
    var deleteArr = [];
    var transit_add = [];
    var transit_delete = [];
    for (i = 0; i < oldArr.length; i++) {
        transit_add[oldArr[i]] = true;
    }
    for (i = 0; i < newArr.length; i++) {
        if (!transit_add[newArr[i]]) {
            addArr.push(newArr[i]);
        }
    }
    for (i = 0; i < newArr.length; i++) {
        transit_delete[newArr[i]] = true;
    }
    for (i = 0; i < oldArr.length; i++) {
        if (!transit_delete[oldArr[i]]) {
            deleteArr.push(oldArr[i]);
        }
    }
    return {
        'addArr': addArr,
        'deleteArr': deleteArr
    }
};
module.exports = ArrayFindDifference;