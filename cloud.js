var AV = require('leanengine');

var OperatorInfo_event = require(__dirname + '/lib/event');
var setDataAcl = require('./routes/v1/lib/setAcl');
var middleTable = require('./routes/v1/lib/middleTable');
var superRoleName = 'super_admin';
var GroupUserMap_middleTable = new middleTable('GroupUserMap','Group','User',undefined,true);
var UserNodeInfoMap_middleTable = new middleTable('UserNodeInfoMap','User','NodeInfo',undefined,true);
GroupUserMap_middleTable.afterSave();
GroupUserMap_middleTable.beforeSave();
GroupUserMap_middleTable.afterDelete('Group');
UserNodeInfoMap_middleTable.afterSave();
UserNodeInfoMap_middleTable.beforeSave();
UserNodeInfoMap_middleTable.afterDelete('_User');

AV.Cloud.afterSave('Group', function(request) {
    var GroupObjectId = request.object.id;
    if(!GroupObjectId){
        throw new AV.Cloud.Error('AccessLink-Platform cloud# Group afterSave No Group ObjectId!');
    }
    else{
        var newRole = AV.Object.extend('_Role');
        var buildGroupRole = new newRole();
        var newGroupRoleName = 'group_admin_' + GroupObjectId;
        buildGroupRole.set('name',newGroupRoleName);
        buildGroupRole.set('Group', request.object);
        buildGroupRole.setACL(setDataAcl([superRoleName,newGroupRoleName]));
        var buildGroupAdminRole = new newRole();
        var newGroupAdminRoleName = 'admin_' + GroupObjectId;
        buildGroupAdminRole.set('name',newGroupAdminRoleName);
        buildGroupAdminRole.set('Group', request.object);
        buildGroupAdminRole.setACL(setDataAcl([superRoleName,newGroupRoleName,newGroupAdminRoleName]));
        var GroupObject = AV.Object.createWithoutData('Group', GroupObjectId);
        var roleAcl = new AV.ACL();
        roleAcl.setRoleWriteAccess(superRoleName, true);
        roleAcl.setRoleReadAccess(superRoleName, true);
        roleAcl.setRoleWriteAccess(newGroupRoleName, true);
        roleAcl.setRoleReadAccess(newGroupRoleName, true);
        // roleAcl.setRoleWriteAccess(current, true);
        roleAcl.setRoleReadAccess(newGroupAdminRoleName, true);
        // GroupObject.set('ACL',setDataAcl([superRoleName,newGroupRoleName]));
        GroupObject.set('ACL', roleAcl);
        //To prevent program from entering cloud function" dead circulation "
        GroupObject.disableBeforeHook();
        GroupObject.disableAfterHook();
        AV.Object.saveAll([buildGroupRole,buildGroupAdminRole,GroupObject],{'useMasterKey':true}).then(function (result) {
            console.log("AccessLink-Platform cloud# Group afterSave set new Group Role success");
            //result[0] is group_admin role
            //result[1] is admin role
            result[1].getRoles().add(result[1]);
            result[1].getRoles().add(result[0]);
            result[0].getRoles().add(result[0]);
            return AV.Object.saveAll([result[0],result[1]],{useMasterKey:true})
        }).catch(function (error) {
            console.error("AccessLink-Platform cloud# Group afterSave set new Group Role failed",error)
        });
    }
});

AV.Cloud.beforeDelete('Group',function (request) {
    var userQuery = new AV.Query('_Role');
    var GroupRoleName = 'group_admin_' + request.object.id;
    var GroupAdminRoleName = 'admin_' + request.object.id;
    userQuery.containedIn('name', [GroupRoleName, GroupAdminRoleName]);
    return Promise.all([
        userQuery.find({useMasterKey:true}),
        GroupUserMap_middleTable.findData(request.object)
    ]).then(function (result) {
        var deleteObject = [];
        result.forEach(function (current) {
            if(current.length>0)
                deleteObject = deleteObject.concat(current)
        });
        return AV.Object.destroyAll(deleteObject,{useMasterKey:true}).then(function () {
            console.log('#Group beforeDelete delete data about group success')
        });
    })
});

AV.Cloud.beforeSave('NodeInfo',function (request) {
    var roleAcl = new AV.ACL();
    var objectId = request.object.get('Group').id;
    roleAcl.setRoleReadAccess('super_admin', true);
    roleAcl.setRoleReadAccess('group_admin_' + objectId, true);
    roleAcl.setRoleWriteAccess('group_admin_' + objectId, true);
    roleAcl.setRoleReadAccess('admin_' + objectId, true);
    request.object.set('ACL',roleAcl);
});

AV.Cloud.beforeDelete('NodeInfo',function (request) {
    return Promise.all([
        UserNodeInfoMap_middleTable.findData(undefined,request.object)
    ]).then(function (result) {
        var deleteObject = [];
        result.forEach(function (current) {
            if(current.length>0)
                deleteObject = deleteObject.concat(current)
        });
        return AV.Object.destroyAll(deleteObject,{useMasterKey:true}).then(function () {
            console.log('#NodeInfo beforeDelete delete data about NodeInfo success')
        });
    })
});

AV.Cloud.beforeDelete('_User',function (request) {
    return Promise.all([
        GroupUserMap_middleTable.findData(undefined,request.object),
        UserNodeInfoMap_middleTable.findData(request.object)
    ]).then(function (result) {
        var deleteObject = [];
        result.forEach(function (current) {
            if(current.length>0)
                deleteObject = deleteObject.concat(current)
        });
        return AV.Object.destroyAll(deleteObject,{useMasterKey:true}).then(function () {
            console.log('#User beforeDelete delete data about NodeInfo success')
        });
    })
});

