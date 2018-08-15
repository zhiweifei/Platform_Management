/**
 * Created by dev03 on 2018/6/12.
 */
var bufferSearch = function () {

    var that = this;
    this.JsonToBuffer = function (json) {
        return Buffer.from(JSON.stringify(json))
    };
    
    this.BufferToJson = function (buf) {
        return JSON.parse(buf.toString())
    };

    this.judgeJsonAttr = function (BufferObject,judgedAttr) {

        var jsonObject = that.BufferToJson(BufferObject);
        if(jsonObject.hasOwnProperty(judgedAttr)){
            return ture;
        }
        else{
            return false;
        }

    };

    this.BuildUp_PollingPeriodObject = function (PollingPeriodObject,node_init) {

        PollingPeriodObject = this.BufferToJson(PollingPeriodObject);
        if (PollingPeriodObject.hasOwnProperty(node_init.PollingPeriod)) {
            PollingPeriodObject[node_init.PollingPeriod][node_init.nodeId] = node_init;
        }
        else{
            PollingPeriodObject[node_init.PollingPeriod] = {};
            PollingPeriodObject[node_init.PollingPeriod][node_init.nodeId] = node_init;
        }
        return this.JsonToBuffer(PollingPeriodObject);
    };
    
    this.update_PollingPeriodObject = function (bufferObject,nodeIdObject) {

        PollingPeriodObject = this.BufferToJson(bufferObject);
        var buildNewInterval = false;
        var clear_Interval;
        var attr1Arr = Object.keys(PollingPeriodObject);
        attr1Arr.forEach(function (attr1Current) {
            var attr2Arr = Object.keys(PollingPeriodObject[attr1Current]);
            if(attr2Arr.indexOf(nodeIdObject.Node) > -1){
                /**
                 * nodeId change PollingPeriod
                 * remove the nodeId object in old PollingPeriodArray
                 */
                if(PollingPeriodObject[attr1Current][nodeIdObject.Node].PollingPeriod != nodeIdObject.PollingPeriod){
                    delete PollingPeriodObject[attr1Current][nodeIdObject.Node];
                    if(PollingPeriodObject.hasOwnProperty(nodeIdObject.PollingPeriod)) {
                        PollingPeriodObject[nodeIdObject.PollingPeriod][nodeIdObject.Node] = nodeIdObject;
                    }
                    else{
                        /**
                         * PollingPeriodObject has not this new pollingPeriod
                         * and then build up new setInterval for this pollingPeriod
                         */
                        nodeIdObject.nodeId = nodeIdObject.Node;
                        PollingPeriodObject[nodeIdObject.PollingPeriod] = {};
                        PollingPeriodObject[nodeIdObject.PollingPeriod][nodeIdObject.Node] = nodeIdObject;
                        buildNewInterval = true;
                    }
                }
            }
        });
        attr1Arr.forEach(function (attr1Current) {
            var attr2Arr = Object.keys(PollingPeriodObject[attr1Current]);
            if(attr2Arr.length == 0){
                /**
                 * nodeId change PollingPeriod
                 * and as a result PollingPeriodArr is null ,delete this useless interval
                 */
                delete PollingPeriodObject[attr1Current];
                clear_Interval = 'Interval' + attr1Current;
            }
        });
        return {
            "PollingPeriodObject" : this.JsonToBuffer(PollingPeriodObject),
            "buildNewInterval" : buildNewInterval,
            "clear_Interval" : clear_Interval
        };

    };

    this.delete_useless_Interval = function (PollingPeriodObject,nodeIdObject) {

        PollingPeriodObject = this.BufferToJson(PollingPeriodObject);
        var attr1Arr = Object.keys(PollingPeriodObject);
        attr1Arr.forEach(function (attr1Current) {
            var attr2Arr = Object.keys(PollingPeriodObject[attr1Current]);
            if(attr2Arr.indexOf(nodeIdObject.Node) > -1){
                /**
                 * nodeId change PollingPeriod
                 * remove the nodeId object in old PollingPeriodArray
                 */
                if(PollingPeriodObject[attr1Current][nodeIdObject.Node].PollingPeriod == nodeIdObject.PollingPeriod){
                    delete PollingPeriodObject[attr1Current][nodeIdObject.Node];
                }
            }
        });
        attr1Arr.forEach(function (attr1Current) {
            var attr2Arr = Object.keys(PollingPeriodObject[attr1Current]);
            if(attr2Arr.length == 0){
                /**
                 * nodeId change PollingPeriod
                 * and as a result PollingPeriodArr is null ,delete this useless interval
                 */
                clearInterval('Interval' + attr1Current)
            }
        });
        return this.JsonToBuffer(PollingPeriodObject);

    };

    
};
module.exports = bufferSearch;