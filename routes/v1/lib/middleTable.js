'use strict';
var AV = require('leancloud-storage');

function middleTable(tableName,filed1,filed2,sessionToken,useMasterKey) {

    this.sessionToken = sessionToken;

    this.useMasterKey = useMasterKey;

    this.tableName = tableName;

    this.filed1 = filed1;

    this.filed2= filed2;

    var that = this;
    // build one new data object
    this.buildOneData = function (filed1_value,filed2_value) {
        var table = AV.Object.extend(this.tableName);
        var tableObject = new table();
        tableObject.set(this.filed1, filed1_value);
        tableObject.set(this.filed2, filed2_value);
        return tableObject;
    };

    // find data by two fileds
    this.findData = function (filed1_value,filed2_value) {
        var tableQuery = new AV.Query(this.tableName);
        if(filed1_value) {
            tableQuery.equalTo(this.filed1, filed1_value);
        }
        if(filed2_value) {
            tableQuery.equalTo(this.filed2, filed2_value);
        }
        return tableQuery.find({
            sessionToken: that.sessionToken,
            useMasterKey: that.useMasterKey
        });
    };

    var mergeAcl = function(jsonObject1, jsonObject2) {
        var resultJsonObject = {};
        for (var attr in jsonObject1) {
            resultJsonObject[attr] = jsonObject1[attr];
        }
        for (var attr in jsonObject2) {
            resultJsonObject[attr] = jsonObject2[attr];
        }
        return resultJsonObject;
    };

    var middleTable_setAcl = function (request) {

        var filed1_Object = request.object.get(that.filed1);
        var filed2_Object = request.object.get(that.filed2);
        console.log("AccessLink-Platform cloud#cloudSetACL tableName",that.tableName);
        if(!filed1_Object || !filed2_Object){
            throw new AV.Cloud.Error('AccessLink-Platform cloud#' + this.tableName + 'afterSave lack filed!');
        }
        else{
            return filed1_Object.fetch({'includeACL':true},{'useMasterKey':true}).then(function (result) {
                result.disableBeforeHook();
                var filed1_ACL_Json = result.getACL();
                return filed2_Object.fetch({'includeACL':true},{'useMasterKey':true}).then(function (result) {
                    result.disableBeforeHook();
                    var filed2_ACL_Json = result.getACL();
                    var setAcl = mergeAcl(filed1_ACL_Json['permissionsById'], filed2_ACL_Json['permissionsById'])
                    request.object.set('ACL',setAcl);
                    return request.object.save(null,{'useMasterKey':true}).then(function()  {
                        // filed2_Object.set('ACL',setAcl);
                        // return filed2_Object.save(null,{'useMasterKey':true}).then(function() {
                            console.log("AccessLink-Platform cloud#" + that.tableName + "afterSave set ACL ok");
                        // })
                    });
                });
            }).catch(function (error) {
                console.error('AccessLink-Platform cloud#cloudSetAC error',error);
                throw new AV.Cloud.Error('set middle table acl error')
            });
        }
    };

    // cloud hook Function afterSave
    this.afterSave = function () {

        AV.Cloud.afterSave(this.tableName, function(request) {
            middleTable_setAcl(request);
        });
    };

    this.beforeSave = function () {

        AV.Cloud.beforeSave(this.tableName,function (request) {
            var filed1_Object = request.object.get(that.filed1);
            var filed2_Object = request.object.get(that.filed2);

            return that.findData(filed1_Object,filed2_Object).then(function (result) {
                if(result.length > 0){
                    throw new AV.Cloud.Error('this middle table data already exists')
                }
            })
        })

    }

    var rewrite_aclByFiled1 = function (request,filed1TableName) {
        var filed1_Object = request.object.get(that.filed1);
        var filed2_Object = request.object.get(that.filed2);
        var filed1_TableQuery = new AV.Query(filed1TableName);
        return filed1_TableQuery.get(filed1_Object.id,{useMasterKey:true}).then(function (result) {
            console.log('delete' + that.tableName + 'data by' + that.filed2);
        }).catch(function (error) {
            if(error.message.indexOf('Object not found')>-1 || error.message.indexOf('Could not find user')>-1){
                console.log('delete' + that.tableName + 'data by' + that.filed1);
                return filed2_Object.fetch({'includeACL':true},{'useMasterKey':true}).then(function (result) {
                    var filed2_ACL_Json = result.getACL();
                    var alc_UseJson = filed2_ACL_Json['permissionsById'];
                    var resultJsonObject = {};
                    for (var attr in alc_UseJson) {
                        // rewrite acl
                        if(!(attr == 'role:group_admin_' + filed1_Object.id || attr == filed1_Object.id)){
                            resultJsonObject[attr] = alc_UseJson[attr];
                        }
                    }
                    filed2_Object.set('ACL',resultJsonObject);
                    return filed2_Object.save(null,{'useMasterKey':true}).then(function() {
                        console.log("AccessLink-Platform cloud#" + that.tableName + "afterSave set ACL ok");
                    })
                })
            }
        })
    };

    this.afterDelete = function (filed1TableName) {

        AV.Cloud.afterDelete(this.tableName, function(request) {
            rewrite_aclByFiled1(request,filed1TableName);
        });

    }
}
module.exports = middleTable;