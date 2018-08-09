/**
 * Created by dev03 on 2018/6/7.
 */
'use strict';

var AV = require('leanengine');
var async = require('async');

var OperateModule = function(req){

    var that = this;
    this.sessionToken = req.headers["sessiontoken"];
    var paramArray;
    switch (req.method){
        case 'GET':
            paramArray = {
                nodeId:{type:"[object Array]",default:[],choosable:false},
                skip:{type:"[object String]",default:"0",choosable:false},
                limit:{type:"[object String]",default:"1000",choosable:false},
                sortby:{type:"[object String]",default:"createdAt",choosable:false},
                order:{type:"[object String]",default:"dsc",choosable:false}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.query[i] == undefined ? paramArray[i]["default"] : req.query[i];
            }
            break;
        case 'POST':
            paramArray = {
                nodeId:{type:"[object String]",default:false,choosable:false},
                AppKey:{type:"[object String]",default:false,choosable:false},
                group:{type:"[object String]",default:false,choosable:false},
                nodeInfo:{type:"[object String]",default:"default",choosable:true},
                protocol:{type:"[object String]",default:false,choosable:false}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.body[i] == undefined ? paramArray[i]["default"] : req.body[i];
            }
            break;
        case 'PUT':
            paramArray = {
                body:{type:"[object Array]",default:undefined,choosable:false}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.body == undefined ? paramArray[i]["default"] : req.body;
            }
            break;
        case 'DELETE':
            paramArray = {
                nodeId:{type:"[object Array]",default:[]}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.query[i] == undefined ? paramArray[i]["default"] : req.query[i];
            }
            break;
    }

    this.paramArray = paramArray;

    this.typeCheck = function(){
        var paramsArray = this.paramArray;
        for(var i in paramsArray){
            if(!(paramsArray[i].choosable == true && paramsArray[i].value == undefined)) {
                if (Object.prototype.toString.call(paramsArray[i].value) != paramsArray[i].type) {
                    throw new AV.Error(403, "error, invalid param in " + i);
                }
            }
        }
        return 'true'
    };

    this.getNodeIds = function(){

        var query = new AV.Query('NodeInfo');
        return query.find({"sessionToken":that.sessionToken}).then(function (td) {
            if(JSON.stringify(td) != "[]"){
                var idRanges = [];
                td.forEach(function(ele){
                    idRanges.push(ele.get('nodeId'));
                });
                console.log("user own idRanges",idRanges);
                return idRanges;

            }else{
                throw new AV.Error(404,"error, nodeId not found");
            }
        });
    };

    this.nodeInfoQuery = function(idRanges){
        var nodeId = this.paramArray.nodeId.value;
        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;
        var sortby = this.paramArray.sortby.value;
        var order = this.paramArray.order.value;

        /* Select reader ID range */
        var nodeInfoQuery = new AV.Query('NodeInfo');
        var nodeIds = [];
        if(JSON.stringify(nodeId) != "[]") {
            nodeId.forEach(function(specifyid){
                if(idRanges.indexOf(specifyid) != -1) {
                    nodeIds.push(specifyid);
                }
            });
            if(nodeIds.length!=0){
                nodeInfoQuery.containedIn('nodeId',nodeIds);
            }else{
                throw new AV.Error(404,"query id is not in 'nodeIds'!");
            }

        }else{
            nodeInfoQuery.containedIn('nodeId',idRanges);
        }
        nodeInfoQuery.include('Group');
        nodeInfoQuery.skip(skip);
        nodeInfoQuery.limit(limit);
        // sort history data by order
        if(order == "dsc"){
            nodeInfoQuery.descending(sortby);
        }else{
            nodeInfoQuery.addAscending(sortby)
        }
        return nodeInfoQuery.find({'sessionToken':this.sessionToken});
    };

    var determineGroupExist = function (groupname) {

        var groupQuery = new AV.Query('Group');
        var groupNameArr = [];
        return groupQuery.find({'sessionToken':that.sessionToken}).then(function (result) {
            result.forEach(function (currentValue) {
                var currentJsonObject = currentValue.toJSON();
                groupNameArr.push(currentJsonObject.name)
            });
            if(groupNameArr.indexOf(groupname) > -1){
                console.log('testtesttest',result[groupNameArr.indexOf(groupname)]);
                return result[groupNameArr.indexOf(groupname)]
            }
            else{
                throw new AV.Error('403','error related group')
            }
        })

    };

    this.buildUpNewNode = function () {

        return new Promise(function (resolve,reject) {
            var nodeId = that.paramArray.nodeId.value;
            var bufferNodeId = Buffer.from(nodeId,'hex');
            if(bufferNodeId.length != 8){
                throw new AV.Error(403,'error length nodeId')
            }
            var AppKey = that.paramArray.AppKey.value;
            var bufferAppKey = Buffer.from(AppKey,'hex');
            if(bufferAppKey.length != 16){
                throw new AV.Error(403,'error length AppKey')
            }
            var nodeInfo = that.paramArray.nodeInfo.value;
            var protocol = that.paramArray.protocol.value;
            var group = that.paramArray.group.value;
            console.log('AccessLink-Platform_Management device management# nodeId AppKey nodeInfo',nodeId,AppKey,nodeInfo,group);
            var NodeInfoObject = AV.Object.extend('NodeInfo');
            var NewNodeInfoObject = new NodeInfoObject();
            NewNodeInfoObject.set('nodeId',nodeId);
            NewNodeInfoObject.set('AppKey',AppKey);
            NewNodeInfoObject.set('TCP_IP','Unsupport');
            if(nodeInfo != 'default'){
                NewNodeInfoObject.set('NodeInfo',nodeInfo);
            }
            NewNodeInfoObject.set('Protocol',protocol);
            determineGroupExist(group).then(function (rightGroup) {
                NewNodeInfoObject.set('Group',rightGroup);
            }).then(function () {
                return NewNodeInfoObject.save(null,{'sessionToken':that.sessionToken}).then(function (todo) {
                    console.log('AccessLink-Platform_Management device management# build up new nodeId successfully and objectId is ' + todo.id);
                    resolve('success')
                })
            }).catch(function (error) {
                console.error('AccessLink-Platform_Management device management# build up new nodeId ERROR',error);
                if(error.hasOwnProperty('message')) {
                    if (error.message.indexOf('A unique field was given a value that is already taken') > -1) {
                        reject(new AV.Error(403, 'The nodeId is occupied'));
                    }
                    else if (error.message.indexOf("Invalid value type for field 'nodeId'") > -1) {
                        reject(new AV.Error(403, 'Invalid nodeId'));
                    }
                    else if (error.message.indexOf("Invalid value type for field 'AppKey'") > -1) {
                        reject(new AV.Error(403, 'Invalid AppKey'));
                    }
                    else if (error.message.indexOf('Forbidden to create by class') > -1) {
                        reject(new AV.Error(401, 'no authority to build up group'));
                    }
                    else {
                        reject(new AV.Error(401, 'there is a server error'));
                    }
                }
                else{
                    reject(new AV.Error(401, 'there is a server error'));
                }
            });

        })

    };

    this.updateAllNode = function () {

        var updateInfo = this.paramArray.body.value;
        return new Promise(function (resolve,reject) {
            async.map(updateInfo,function (current,callback) {
                if(!current.nodeId){
                    reject(new AV.Error(403,'Invalid nodeId'))
                }
                if(Object.keys(current).length == 1){
                    reject(new AV.Error(403 ,'At least one updateInfo not include nodeId'));
                }
                var nodeInfoQuery = new AV.Query('NodeInfo');
                nodeInfoQuery.equalTo('nodeId',current.nodeId);
                nodeInfoQuery.find({'sessionToken':that.sessionToken}).then(function (result) {
                    if(result.length == 0){
                        reject(new AV.Error(404,'nodeId not found or no authority'))
                    }
                    return result[0]
                }).then(function (updateObject) {
                    if(typeof current.nodeInfo != 'undefined'){
                        updateObject.set('NodeInfo',current.nodeInfo);
                    }
                    if(typeof current.AppKey != 'undefined'){
                        updateObject.set('AppKey',current.AppKey);
                    }
                    if(typeof current.protocol != 'undefined'){
                        updateObject.set('Protocol',current.protocol);
                    }
                    callback(null,updateObject);
                }).catch(function (error) {
                    console.error('AccessLink-Platform_Management device management# /node/put find error',error);
                    reject(new AV.Error(401,'there is a server error'))
                })
            },function (error,result) {
                AV.Object.saveAll(result,{'sessionToken':that.sessionToken}).then(function () {
                    resolve('success')
                },function (error) {
                    console.error('AccessLink-Platform_Management device management# /node/put save error',error);
                    if(error.hasOwnProperty('message')) {
                        if (error.message.indexOf("Invalid value type for field 'nodeInfo'") > -1) {
                            reject(new AV.Error(403, 'Invalid nodeInfo'));
                        }
                        else if (error.message.indexOf("Invalid value type for field 'AppKey'") > -1) {
                            reject(new AV.Error(403, 'Invalid AppKey'));
                        }
                        else if(error.message.indexOf('Forbidden writing by object') > -1){
                            reject(new AV.Error(403, 'no authority to update nodeInfo'));
                        }
                        else {
                            reject(new AV.Error(401, 'there is a server error'))
                        }
                    }
                    else {
                        reject(new AV.Error(401, 'there is a server error'))
                    }
                })
            });
        })

    };

    this.deleteAllNode = function () {

        return new Promise(function (resolve,reject) {
            var nodeId = that.paramArray.nodeId.value;
            var nodeInfoQuery = new AV.Query('NodeInfo');
            nodeInfoQuery.containedIn('nodeId',nodeId);
            nodeInfoQuery.find({'sessionToken':that.sessionToken}).then(function (result) {
                if(result.length == 0){
                    reject(new AV.Error(404, 'nodeId not found or no authority'))
                }
                return AV.Object.destroyAll(result,{'sessionToken':that.sessionToken}).then(function () {
                    resolve('delete NodeInfo successfully')
                })
            }).catch(function (error) {
                console.error('AccessLink-Platform_Management device management /node/delete error',error);
                if(error.hasOwnProperty('message')) {
                    if (error.message.indexOf('Forbidden to delete by class') > -1) {
                        reject(new AV.Error(403, 'no authority to delete nodeInfo'));
                    }
                    else if(error.message.indexOf('Forbidden writing by object') > -1){
                        reject(new AV.Error(403, 'no authority to delete nodeInfo'));
                    }
                    else
                    {
                        reject(new AV.Error(401, 'there is a server error'));
                    }
                }
                else{
                    reject(new AV.Error(401, 'there is a server error'));
                }
            })
        })

    };

    this.getNodeCount = function () {

        var queryNodeInfo = new AV.Query('NodeInfo');
        return queryNodeInfo.count({'sessionToken': that.sessionToken})

    };

    this.getOneFiledInfo = function (select) {

        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;
        var sortby = this.paramArray.sortby.value;
        var order = this.paramArray.order.value;
        var nodeInfoQuery = new AV.Query('NodeInfo');
        nodeInfoQuery.skip(skip);
        nodeInfoQuery.limit(limit);
        nodeInfoQuery.select(select)
        // sort history data by order
        if(order == "dsc"){
            nodeInfoQuery.descending(sortby);
        }else{
            nodeInfoQuery.addAscending(sortby)
        }
        return nodeInfoQuery.find({'sessionToken':this.sessionToken});

    };

};

module.exports = OperateModule;