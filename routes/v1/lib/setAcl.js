'use strict';
var AV = require('leancloud-storage');
var setAcl = function (Role,User) {
    var roleAcl = new AV.ACL();
    Role.forEach(function (current) {
        roleAcl.setRoleWriteAccess(current, true);
        roleAcl.setRoleReadAccess(current, true);
    });
    if(typeof User != 'undefined'){
        User.forEach(function (current) {
            roleAcl.setWriteAccess(current, true);
            roleAcl.setReadAccess(current, true);
        });
    }
    console.log('roleAcl',roleAcl);
    return roleAcl;
};
module.exports = setAcl;