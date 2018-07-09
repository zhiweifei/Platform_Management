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



AV.Cloud.afterSave('OperatorInfo', function(request) {

    var data = request.object.toJSON();
    console.log("OperatorInfo save data as",data);
    var nodeInfoQuery = new AV.Query('NodeInfo');
    var userQuery = new AV.Query('_User');
    Promise.all([
        nodeInfoQuery.get(data.Node.objectId),
        userQuery.get(data.PostUser.objectId)
    ]).then(function (result) {
        data.Node = result[0].get('nodeId');
        data.PostMail = result[1].get('email');
        data.PostSMS = result[1].get('mobilePhoneNumber');
        console.log('cloud# event_OperatorInfo_afterSave send data',data);
        OperatorInfo_event.event.emit('event_OperatorInfo_afterSave', data );
    });

});

AV.Cloud.afterUpdate('OperatorInfo', function(request) {

    var data = request.object.toJSON();
    console.log("OperatorInfo save data as",data);
    var nodeInfoQuery = new AV.Query('NodeInfo');
    var userQuery = new AV.Query('_User');
    Promise.all([
        nodeInfoQuery.get(data.Node.objectId),
        userQuery.get(data.PostUser.objectId)
    ]).then(function (result) {
        data.Node = result[0].get('nodeId');
        data.PostMail = result[1].get('email');
        data.PostSMS = result[1].get('mobilePhoneNumber');
        console.log('cloud# event_OperatorInfo_afterUpdate send data',data);
        OperatorInfo_event.event.emit('event_OperatorInfo_afterUpdate', data );
    });


});

AV.Cloud.afterDelete('OperatorInfo', function(request) {

    var data = request.object.toJSON();
    console.log("OperatorInfo save data as",data);
    var nodeInfoQuery = new AV.Query('NodeInfo');
    var userQuery = new AV.Query('_User');
    Promise.all([
        nodeInfoQuery.get(data.Node.objectId),
        userQuery.get(data.PostUser.objectId)
    ]).then(function (result) {
        data.Node = result[0].get('nodeId');
        data.PostMail = result[1].get('email');
        data.PostSMS = result[1].get('mobilePhoneNumber');
        console.log('cloud# event_OperatorInfo_afterDelete send data',data);
        OperatorInfo_event.event.emit('event_OperatorInfo_afterDelete', data );
    });

});


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
        GroupObject.set('ACL',setDataAcl([superRoleName,newGroupRoleName]));
        //To prevent program from entering cloud function" dead circulation "
        GroupObject.disableBeforeHook();
        GroupObject.disableAfterHook();
        AV.Object.saveAll([buildGroupRole,buildGroupAdminRole,GroupObject],{'useMasterKey':true}).then(function (result) {
            console.log("AccessLink-Platform cloud# Group afterSave set new Group Role success",result);
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
    console.log("#cloud delete Group request.object",request.object);
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
        console.log('#cloud delete Group deleteObject',deleteObject);
        return AV.Object.destroyAll(deleteObject,{useMasterKey:true}).then(function () {
            console.log('#Group beforeDelete delete data about group success')
        });
    })
});

AV.Cloud.beforeDelete('NodeInfo',function (request) {
    console.log("#cloud delete NodeInfo request.object",request.object);
    return Promise.all([
        UserNodeInfoMap_middleTable.findData(undefined,request.object)
    ]).then(function (result) {
        var deleteObject = [];
        result.forEach(function (current) {
            if(current.length>0)
                deleteObject = deleteObject.concat(current)
        });
        console.log('#cloud delete NodeInfo deleteObject',deleteObject);
        return AV.Object.destroyAll(deleteObject,{useMasterKey:true}).then(function () {
            console.log('#NodeInfo beforeDelete delete data about NodeInfo success')
        });
    })
});

AV.Cloud.beforeDelete('_User',function (request) {
    console.log("#cloud delete User request.object",request.object);
    return Promise.all([
        GroupUserMap_middleTable.findData(undefined,request.object),
        UserNodeInfoMap_middleTable.findData(request.object)
    ]).then(function (result) {
        var deleteObject = [];
        result.forEach(function (current) {
            if(current.length>0)
                deleteObject = deleteObject.concat(current)
        });
        console.log('#cloud delete User deleteObject',deleteObject);
        return AV.Object.destroyAll(deleteObject,{useMasterKey:true}).then(function () {
            console.log('#User beforeDelete delete data about NodeInfo success')
        });
    })
});

