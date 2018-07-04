var AV = require('leanengine');

var OperatorInfo_event = require(__dirname + '/lib/event');
AV.Cloud.afterSave('OperatorInfo', function(request) {

    var data = request.object.toJSON();
    console.log("AccessLink-Platform_Management OperatorInfo table# save data as",data);
    var nodeInfoQuery = new AV.Query('NodeInfo');
    var userQuery = new AV.Query('_User');
    Promise.all([
        nodeInfoQuery.get(data.Node.objectId),
        userQuery.get(data.PostUser.objectId)
    ]).then(function (result) {
        data.Node = result[0].get('nodeId');
        data.PostMail = result[1].get('email');
        data.PostSMS = result[1].get('mobilePhoneNumber');
        console.log('AccessLink-Platform_Management OperatorInfo table# event_OperatorInfo_afterSave send data',data);
        OperatorInfo_event.event.emit('event_OperatorInfo_afterSave', data );
    });

});

AV.Cloud.afterUpdate('OperatorInfo', function(request) {

    var data = request.object.toJSON();
    console.log("AccessLink-Platform_Management OperatorInfo table# update data as",data);
    var nodeInfoQuery = new AV.Query('NodeInfo');
    var userQuery = new AV.Query('_User');
    Promise.all([
        nodeInfoQuery.get(data.Node.objectId),
        userQuery.get(data.PostUser.objectId)
    ]).then(function (result) {
        data.Node = result[0].get('nodeId');
        data.PostMail = result[1].get('email');
        data.PostSMS = result[1].get('mobilePhoneNumber');
        console.log('AccessLink-Platform_Management OperatorInfo table# event_OperatorInfo_afterUpdate send data',data);
        OperatorInfo_event.event.emit('event_OperatorInfo_afterUpdate', data );
    });


});

AV.Cloud.afterDelete('OperatorInfo', function(request) {

    var data = request.object.toJSON();
    console.log("AccessLink-Platform_Management OperatorInfo table# delete data as",data);
    var nodeInfoQuery = new AV.Query('NodeInfo');
    var userQuery = new AV.Query('_User');
    Promise.all([
        nodeInfoQuery.get(data.Node.objectId),
        userQuery.get(data.PostUser.objectId)
    ]).then(function (result) {
        data.Node = result[0].get('nodeId');
        data.PostMail = result[1].get('email');
        data.PostSMS = result[1].get('mobilePhoneNumber');
        console.log('AccessLink-Platform_Management OperatorInfo table## event_OperatorInfo_afterDelete send data',data);
        OperatorInfo_event.event.emit('event_OperatorInfo_afterDelete', data );
    });

});

