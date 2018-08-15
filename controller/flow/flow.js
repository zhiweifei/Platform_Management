/**
 * Created by dev03 on 2018/6/1.
 */
var simboss = require('./lib/simboss');
var AV = require('leancloud-storage');
var sendMail = require('./lib/sendEmail');
var OperatorInfo_event = require('../../lib/event');
var bufSearch = require('./lib/bufferSearch');
var bufferSearch = new bufSearch();
var flow = function() {

    var that = this;
    var stage1 = [true,false,false];
    var stage2 = [false,true,false];
    var stage3 = [false,false,true];
    var PollingPeriodObject = bufferSearch.JsonToBuffer({});
    /** just like
     * PollingPeriodObject = {
    '1000':{
        "test1":{"nodeId":"test1", "PostMail":[]},
        "test2":{"nodeId":"test2", "PostMail":[]}
    },
    '2000':{
        "test3":{"nodeId":"test3", "PostMail":[]},
        "test4":{"nodeId":"test4", "PostMail":[]}
    }
}
     */
    var callback_add_newNode_interval = function(records){
        console.log("Operator# receive OperatorInfo aftersave event:", records);
        if(records.hasOwnProperty('PollingPeriod')){
            var node_init = {};
            node_init.stage = stage1;
            node_init.nodeId = records.Node;
            node_init.PostMail = records.PostMail;
            node_init.TrafficThreshold = records.TrafficThreshold;
            node_init.BurstThreshold = records.BurstThreshold;
            node_init.PollingPeriod = records.PollingPeriod;
            node_init.eachFlow = [];
            // if use redis please update it by redis
            if(bufferSearch.judgeJsonAttr(PollingPeriodObject,node_init.PollingPeriod)) {
                PollingPeriodObject = bufferSearch.BuildUp_PollingPeriodObject(PollingPeriodObject, node_init);
            }
            else{
                console.error('this new operatorInfo do not have pollingPeriod');
            }
        }
        else{
            console.error('error operator data');
        }
    };

    var callback_update_node_interval = function(records){
        console.log("Operator# receive OperatorInfo delete or update event:", records);
        if(records.hasOwnProperty('PollingPeriod')){
            /**
             * rewrite PollingPeriodObject if nodeId pollingPeriod has changed
             */
            // if use redis please update it by redis
            records.eachFlow = [];
            records.stage = stage1;
            var updateResponse = bufferSearch.update_PollingPeriodObject(PollingPeriodObject,records);
            PollingPeriodObject = updateResponse.PollingPeriodObject;
            if(updateResponse.buildNewInterval){
                var interval = 'Interval' + records.PollingPeriod;
                interval = setInterval(function () {
                    var PollingPeriod_JSONObject = bufferSearch.BufferToJson(PollingPeriodObject);
                    getOneFlowInfo(PollingPeriod_JSONObject[records.PollingPeriod][records.Node]);
                }, Number(records.PollingPeriod))
            }
            if(typeof updateResponse.clear_Interval != 'undefined'){
                clearInterval(updateResponse.clear_Interval);
            }
        }
        else{
            console.error('error operator data');
        }

    };

    var callback_delete_node_interval = function(records){
        console.log("Operator# receive OperatorInfo delete or update event:", records);
        if(records.hasOwnProperty('PollingPeriod')){
            if(bufferSearch.judgeJsonAttr(PollingPeriodObject,records.PollingPeriod)) {
                /**
                 * delete nodeId in PollingPeriodObject
                 */
                // if use redis please update it by redis
                PollingPeriodObject = bufferSearch.delete_useless_Interval(PollingPeriodObject,records);
            }
            else{

                console.error('this new operatorInfo do not have pollingPeriod33');
            }
        }
        else{
            console.error('error operator data');
        }

    };

    this.deal_Interval_queue = function () {

        OperatorInfo_event.event.on('event_OperatorInfo_afterSave', callback_add_newNode_interval);
        OperatorInfo_event.event.on('event_OperatorInfo_afterUpdate', callback_update_node_interval);
        OperatorInfo_event.event.on('event_OperatorInfo_afterDelete', callback_delete_node_interval);

    };

    var getAllOperatorInfo = function () {
        var OperatorInfoQuery = new AV.Query('OperatorInfo');
        OperatorInfoQuery.include('Node');
        OperatorInfoQuery.include('PostUser');
        return OperatorInfoQuery.find({useMasterKey:true})
    };

    this.dealAllOperatorInfo = function () {
        return new Promise(function (resolve,reject) {
            getAllOperatorInfo().then(function (result) {
                if(result.length > 0){
                    result.forEach(function (current) {

                        var node_init = {};
                        try {
                            node_init.stage = stage1;
                            node_init.nodeId = current.get('Node').get('nodeId');
                            node_init.PostMail = current.get('PostUser').get('email');
                            //node_init.PostSMS = current.get('PostUser').get('mobilePhoneNumber');
                            node_init.TrafficThreshold = current.get('TrafficThreshold');
                            node_init.BurstThreshold = current.get('BurstThreshold');
                            node_init.PollingPeriod = current.get('PollingPeriod');
                            node_init.eachFlow = [];
                            if (typeof node_init.PollingPeriod != 'undefined') {
                                /**
                                 * if use redis please save nodeId in redis
                                 */
                                PollingPeriodObject = bufferSearch.BuildUp_PollingPeriodObject(PollingPeriodObject, node_init);
                            }
                        }
                        catch(e){
                            console.error('get error operatorInfo',e);
                        }
                    });
                    resolve(PollingPeriodObject)

                }
            }).catch(function (error) {
                reject(error);
            })
        });

    };

    this.buildup_setInterval_byPollingPeriod = function (bufferObject) {

        // if use redis please update it by redis
        var jsonObject = bufferSearch.BufferToJson(bufferObject);
        for (var attr1 in jsonObject) {

            for (var attr2 in jsonObject[attr1]) {
                var interval = 'Interval' + attr1;
                interval = setInterval(function () {
                    var PollingPeriod_JSONObject = bufferSearch.BufferToJson(PollingPeriodObject);
                    var operatorInfo = PollingPeriod_JSONObject[attr1][attr2];
                    getOneFlowInfo(operatorInfo);
                }, Number(attr1));
            }

        }

    };

    var getOneFlowInfo = function (operatorInfo) {
        var use_simboss = new simboss();
        var paramSort = use_simboss.paramSort({'iccid': operatorInfo.nodeId});
        var sign = use_simboss.encrypt(paramSort);
        try{
            use_simboss.reqSimboss('/2.0/device/detail', Object.assign(paramSort, {'sign': sign}),function (body) {
                if (body.data.status == 'activation') {
                    var totalFlow = body.data.totalDataVolume;
                    var usedFlow = body.data.usedDataVolume;
                    deal_TrafficThreshold(usedFlow,totalFlow,operatorInfo);
                    deal_BurstThreshold(usedFlow,operatorInfo)
                }
                else {
                    console.log('simboss card not be Activated')
                }
            });
        }
        catch(e){
            console.error('req error',error)
        }
    };

    var deal_TrafficThreshold = function (usedFlow,totalFlow,operatorInfo) {
        var usedFlow_percentage = (usedFlow / totalFlow) * 100;
        var TrafficThreshold = operatorInfo.TrafficThreshold;
        var stage = operatorInfo.stage;
        if(typeof TrafficThreshold != 'undefined') {
            if ( TrafficThreshold[0] <= usedFlow_percentage < TrafficThreshold[1] && stage == stage1) {
                stage = stage2;
                sendMail(PostMail, 'test', 'test');

            }
            if (TrafficThreshold[1] <= usedFlow_percentage < TrafficThreshold[2] && stage == stage2) {
                stage = stage3;
                sendMail(PostMail, 'test', 'test');
            }
            if (usedFlow_percentage >= TrafficThreshold[2] && stage == stage3) {
                operatorInfo.stage = stage1;
                sendMail(PostMail, 'test', 'test');
            }
        }
        else{
            console.error('error operatorInfo whose TrafficThreshold is undefined');
        }
    };

    var deal_BurstThreshold = function (usedFlow,operatorInfo) {
        var eachFlow = operatorInfo.eachFlow;
        if (usedFlow != eachFlow[eachFlow.length - 1]) {
            eachFlow.push(usedFlow);
        }
        else {
            operatorInfo.eachFlow = [];
            operatorInfo.eachFlow.push(usedFlow);
        }
        if (eachFlow.length > 20) {
            console.log('eachFlow length', eachFlow.length);
            var deleteFlow = eachFlow[0];
            operatorInfo.eachFlow = eachFlow = eachFlow.slice(1);
            if (eachFlow.length == 20) {
                AVG = (eachFlow[19] - deleteFlow) / 20;
                console.log('#operator each flow AVG', AVG);
                if (eachFlow[19] - eachFlow[18] > AVG * (100 + operatorInfo.BurstThreshold) / 100) {
                    sendMail(PostMail, 'test', 'test');
                }
            }
        }
    };

};
module.exports = flow;
