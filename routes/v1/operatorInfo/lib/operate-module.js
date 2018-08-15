/**
 * Created by dev03 on 2018/5/29.
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
        case 'PUT':
            paramArray = {
                updateInfo:{type:"[object Array]",default:undefined,choosable:false}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.body == undefined ? paramArray[i]["default"] : req.body;
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
    }

    this.OperatorInfoQuery = function(idRanges){
        var nodeId = this.paramArray.nodeId.value;
        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;
        var sortby = this.paramArray.sortby.value;
        var order = this.paramArray.order.value;

        var OperatorInfoQuery = new AV.Query('OperatorInfo');
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
        OperatorInfoQuery.matchesQuery('Node',nodeInfoQuery);
        OperatorInfoQuery.include('nodeInfo.nodeId');
        OperatorInfoQuery.include('PostUser');
        OperatorInfoQuery.skip(skip);
        OperatorInfoQuery.limit(limit);
        // sort history data by order
        if(order == "dsc"){
            OperatorInfoQuery.descending(sortby);
        }else{
            OperatorInfoQuery.addAscending(sortby)
        }
        return OperatorInfoQuery.find({'sessionToken':this.sessionToken});
    };

    var findUserObject = function (name) {

        var UserQuery = new AV.Query('_User');
        UserQuery.equalTo('username',name);
        return UserQuery.find({'sessionToken':that.sessionToken})

    };

    this.updateNodeInfo = function () {
        var updateInfo = this.paramArray.updateInfo.value;
        console.log('Operator /operator/put#  update updateInfo',updateInfo);
        return new Promise(function (resolve,reject) {
            async.map(updateInfo,function (current,callback) {
                if(!current.nodeId){
                    throw new AV.Error(403,"invalid nodeId");
                }
                if(Object.keys(current).length == 1){
                    throw new AV.Error(403,"Postmail,PostSMS,PollingPeriod,TrafficThreshold,BurstThreshold at least one")
                }
                var OperatorInfoQuery = new AV.Query('OperatorInfo');
                var NodeInfoQuery =  new AV.Query('NodeInfo');
                NodeInfoQuery.equalTo('nodeId',current.nodeId);
                OperatorInfoQuery.matchesQuery('Node',NodeInfoQuery);
                OperatorInfoQuery.find({'sessionToken':that.sessionToken}).then(function (result) {
                    if(typeof current.PollingPeriod != 'undefined'){
                        result[0].set('PollingPeriod',current.PollingPeriod)
                    }
                    if(typeof current.TrafficThreshold != 'undefined'){
                        result[0].set('TrafficThreshold',current.TrafficThreshold)
                    }
                    if(typeof current.BurstThreshold != 'undefined'){
                        result[0].set('BurstThreshold',current.BurstThreshold)
                    }
                    if(typeof current.PostUser != 'undefined'){
                        findUserObject(current.PostUser).then(function (userObject) {
                            result[0].set('PostUser',userObject[0]);
                            callback(null,result[0])
                        })
                    }
                    else{
                        callback(null,result[0]);
                    }
                },function (error) {
                    reject(new AV.Error(404,"can not find data by this nodeId"))
                })
            },function (error,result) {
                AV.Object.saveAll(result,{'sessionToken':that.sessionToken}).then(function () {
                    resolve('update handleInfo successfully')
                },function (error) {
                    console.error('Operator /Operator/put#  update alarmInfo error',error);
                    if(error.hasOwnProperty('message')) {
                        if (error.message.indexOf("Invalid value type for field 'PostUser'") > -1) {
                            reject(new AV.Error(403, 'Invalid Postmail'));
                        }
                        else if (error.message.indexOf("Invalid value type for field 'PollingPeriod'") > -1) {
                            reject(new AV.Error(403, 'Invalid PollingPeriod'));
                        }
                        else if (error.message.indexOf("Invalid value type for field 'TrafficThreshold'") > -1) {
                            reject(new AV.Error(403, 'Invalid TrafficThreshold'));
                        }
                        else if (error.message.indexOf("Invalid value type for field 'BurstThreshold'") > -1) {
                            reject(new AV.Error(403, 'Invalid BurstThreshold'));
                        }
                        else{
                            reject(new AV.Error(401, 'there is a server error'));
                        }
                    }
                    else {
                        reject(new AV.Error(401, 'there is a server error'));
                    }
                })
            });
        })

    }
};

module.exports = OperateModule;