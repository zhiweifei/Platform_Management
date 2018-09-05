'use strict';
var AV = require('leancloud-storage');

function middleTable(tableName, pointer1, pointer2, sessionToken, useMasterKey) {

    this.sessionToken = sessionToken;

    this.useMasterKey = useMasterKey;

    this.tableName = tableName;

    this.pointer1 = pointer1;

    this.pointer2 = pointer2;

    var that = this;
    // build one new data object
    this.buildOneData = function(pointer1_value, pointer2_value) {
        var table = AV.Object.extend(this.tableName);
        var tableObject = new table();
        tableObject.set(this.pointer1, pointer1_value);
        tableObject.set(this.pointer2, pointer2_value);
        return tableObject;
    };

    // find data by two fileds
    this.findData = function(pointer1_value, pointer2_value) {
        var tableQuery = new AV.Query(this.tableName);
        if (pointer1_value) {
            tableQuery.equalTo(this.pointer1, pointer1_value);
        }
        if (pointer2_value) {
            tableQuery.equalTo(this.pointer2, pointer2_value);
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

    var middleTable_setAcl = function(request) {

        var pointer1_Object = request.object.get(that.pointer1);
        var pointer2_Object = request.object.get(that.pointer2);
        console.log("AccessLink-Platform cloud#cloudSetACL tableName", that.tableName);
        if (!pointer1_Object || !pointer2_Object) {
            throw new AV.Cloud.Error('AccessLink-Platform cloud#' + this.tableName + 'afterSave lack filed!');
        } else {
            return pointer1_Object.fetch({ 'includeACL': true }, { 'useMasterKey': true }).then(function(result) {
                result.disableBeforeHook();
                var pointer1_ACL_Json = result.getACL();
                return pointer2_Object.fetch({ 'includeACL': true }, { 'useMasterKey': true }).then(function(result) {
                    result.disableBeforeHook();
                    var pointer2_ACL_Json = result.getACL();
                    var setAcl = mergeAcl(pointer1_ACL_Json['permissionsById'], pointer2_ACL_Json['permissionsById'])
                    request.object.set('ACL', setAcl);
                    return request.object.save(null, { 'useMasterKey': true }).then(function() {
                        // pointer2_Object.set('ACL',setAcl);
                        // return pointer2_Object.save(null,{'useMasterKey':true}).then(function() {
                        console.log("AccessLink-Platform cloud#" + that.tableName + "afterSave set ACL ok");
                        // })
                    });
                });
            }).catch(function(error) {
                console.error('AccessLink-Platform cloud#cloudSetAC error', error);
                throw new AV.Cloud.Error('set middle table acl error')
            });
        }
    };

    // cloud hook Function afterSave
    this.afterSave = function() {

        AV.Cloud.afterSave(this.tableName, function(request) {
            middleTable_setAcl(request);
        });
    };

    this.beforeSave = function() {

        AV.Cloud.beforeSave(this.tableName, function(request) {
            var pointer1_Object = request.object.get(that.pointer1);
            var pointer2_Object = request.object.get(that.pointer2);

            return that.findData(pointer1_Object, pointer2_Object).then(function(result) {
                if (result.length > 0) {
                    throw new AV.Cloud.Error('this middle table data already exists')
                }
            })
        })

    }

    /**
     * 重写中间表pointer2指向的对象的acl
     * @param request: 中间表数据对象
     */
    var rewrite_pointer2_acl = function(request) {
        var pointer1_Object = request.object.get(that.pointer1);
        var pointer2_Object = request.object.get(that.pointer2);
        return pointer2_Object.fetch({ 'includeACL': true }, { 'useMasterKey': true }).then(function(result) {
            var pointer2_ACL_Json = result.getACL();
            var alc_UseJson = pointer2_ACL_Json['permissionsById'];
            delete alc_UseJson['role:group_admin_' + pointer1_Object.id];
            pointer2_Object.set('ACL', alc_UseJson);
            return pointer2_Object.save(null, { 'useMasterKey': true }).then(function() {
                console.log("AccessLink-Platform cloud#" + that.tableName + "afterSave set ACL ok");
            })
        }).catch(function(error) {
            console.error('rewrite ' + that.pointer2 + " acl error " + error)
        })
    };

    this.afterDelete = function() {

        AV.Cloud.afterDelete(this.tableName, function(request) {
            rewrite_pointer2_acl(request);
        });

    }
}
module.exports = middleTable;