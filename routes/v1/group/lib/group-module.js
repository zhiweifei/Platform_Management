/**
 * Created by dev03 on 2018/4/16.
 */
var AV = require('leancloud-storage');
var async = require('async');
var ArrayFindDifference = require('../../lib/ArrayFindDifference');
var middleTable = require('../../lib/middleTable');

/**
     * 从传参里找到正确的用户
     * @param ArrParam: 参数里的user数组
     * @param table: 查询的表格名
     * @param field: 表格里要匹配的属性
     */
var findValidUser =  function (ArrParam,table,field) {
    var Query = new AV.Query(table);
    Query.containedIn(field, typeof ArrParam=='undefined'? []:ArrParam);
    return Query.find({"useMasterKey": true}).then(function (result) {
        return result
    });
};

/**
     * 给组织关联用户设置组织管理员权限
     * @param newGroup: 创建的新组织
     * @param user: 关联用户
     */
var setGroupRoleToUserACL = function(newGroup, user){
    var groupid = newGroup.toJSON().objectId;
    return user.fetch({'includeACL':true},{'useMasterKey':true}).then(function (result) {
        var userAcl = result.getACL();
        userAcl.setRoleReadAccess('group_admin_' + groupid, true);
        user.set('ACL',userAcl)
        return user.save(null,{'useMasterKey':true}).then(function()  {
            console.log("AccessLink-Platform /group# relate_GroupToUser set User ACL ok")
            return 
        })
    }).catch(function(error){
        console.error("AccessLink-Platform /group# relate_GroupToUser set User ACL error", error)
        throw error
    })
}


/**
     * 中间表里创建组织用户关联数据
     * @param User: 关联用户
     * @param newGroup: 创建的新组织
     * @param sessionToken: 创建者的sessionToken
     */
var relate_GroupToUser = function (User,newGroup,sessionToken) {
    var GroupUserMap_middleTable = new middleTable('GroupUserMap','Group','User',sessionToken);
    return findValidUser(User, '_User', 'username').then(function (objectUsers) {
        //make sure all Users are right and findValidUser successfully
        if (objectUsers.length > 0 && objectUsers.length == User.length) {
            return new Promise(function(resolve, reject){
                async.map(objectUsers, function(current_user, callback){
                    setGroupRoleToUserACL(newGroup, current_user).then(function(){
                        var midNewData = GroupUserMap_middleTable.buildOneData(newGroup, current_user)
                        callback(null, midNewData)
                    },function(err){
                        throw err
                    })
                },function(err, result){
                    resolve(result)
                })
            })
        }
        else {
            throw(new AV.Error(403, 'Invalid user'))
        }
    })
};

/**
     * 组织role关联用户
     * @param User: 关联用户
     * @param 组织的ObjectId: ObjectId
     * @param admin: 管理员类型
     */
var relate_UserToRole = function (User,ObjectId,admin) {
    var allUser;
    return new Promise(function (resolve, reject) {
        findValidUser(User, '_User', 'username').then(function (objectUsers) {
            if(objectUsers.length >0){
                allUser = objectUsers;
                var roleQuery = new AV.Query(AV.Role);
                roleQuery.equalTo('name', admin + ObjectId);
                return roleQuery.find({'useMasterKey': true})
            }
            else{
                throw new AV.Error(403, 'Invalid user')
            }
        }).then(function (results) {
            var administratorRole = results[0];
            var relation = administratorRole.getUsers();
            relation.add(allUser);
            resolve([administratorRole]);
        }).catch(function (error) {
            if(error.hasOwnProperty('message')){
                reject(new AV.Error(403, 'Invalid user'))
            }
            else {
                reject(new AV.Error(401, 'there is a server error'))
            }
        });
    })
};

/**
     * 创建组织角色
     * @param request: 创建的组织对象
     */
var buildNewGroupRole = function(request) {
    var setDataAcl = require('../../lib/setAcl');
    var GroupObjectId = request.id;
    if(!GroupObjectId){
        throw new AV.Cloud.Error('AccessLink-Platform cloud# Group afterSave No Group ObjectId!');
    }
    else{
        var superRoleName = 'super_admin';
        var newRole = AV.Object.extend('_Role');
        var buildGroupRole = new newRole();
        var newGroupRoleName = 'group_admin_' + GroupObjectId;
        buildGroupRole.set('name',newGroupRoleName);
        buildGroupRole.set('Group', request);
        buildGroupRole.setACL(setDataAcl([superRoleName,newGroupRoleName]));
        var buildGroupNormalRole = new newRole();
        var newGroupNormalRoleName = 'admin_' + GroupObjectId;
        buildGroupNormalRole.set('name',newGroupNormalRoleName);
        buildGroupNormalRole.set('Group', request);
        buildGroupNormalRole.setACL(setDataAcl([superRoleName,newGroupRoleName,newGroupNormalRoleName]));
        var GroupObject = AV.Object.createWithoutData('Group', GroupObjectId);
        var roleAcl = new AV.ACL();
        roleAcl.setRoleWriteAccess(superRoleName, true);
        roleAcl.setRoleReadAccess(superRoleName, true);
        roleAcl.setRoleWriteAccess(newGroupRoleName, true);
        roleAcl.setRoleReadAccess(newGroupRoleName, true);
        roleAcl.setRoleReadAccess(newGroupNormalRoleName, true);
        GroupObject.set('ACL', roleAcl);
        //To prevent program from entering cloud function" dead circulation "
        GroupObject.disableBeforeHook();
        GroupObject.disableAfterHook();
        return AV.Object.saveAll([buildGroupRole,buildGroupNormalRole,GroupObject],{'useMasterKey':true}).then(function (result) {
            console.log("AccessLink-Platform cloud# Group afterSave set new Group Role success");
            //result[0] is group_admin role
            //result[1] is admin role
            result[1].getRoles().add(result[1]);
            result[1].getRoles().add(result[0]);
            result[0].getRoles().add(result[0]);
            return AV.Object.saveAll([result[0],result[1]],{useMasterKey:true}).then(function(){
                return request
            })
        }).catch(function (error) {
            console.error("AccessLink-Platform cloud# Group afterSave set new Group Role failed",error)
        });
    }
}


/**
     * 创建一个组织
     * @param currentBuild: 创建当前组织请求的参数
     * @param sessionToken: 调用api的用户的sessionToken
     */
var buildUpOneGroup = function (currentBuild,sessionToken) {

    return new Promise(function (resolve,reject) {
        var groupInfo = currentBuild.groupInfo;
        var related_user = currentBuild.user;
        var bodyName = currentBuild.name;
        if(typeof bodyName == 'undefined'){
            throw new AV.Error(403,'Invalid group name');
        }
        var GroupObject = AV.Object.extend('Group');
        var NewGroup = new GroupObject();
        NewGroup.set('name', bodyName);
        NewGroup.set('groupInfo', groupInfo);

        if (Array.isArray(related_user)) {
            if(related_user.length == 0){
                reject(new AV.Error(403,'Invalid user'))
            }
        }
        NewGroup.save(null,{'sessionToken': sessionToken}).then(function(NewGroupObject){
            resolve(NewGroupObject)
        }).catch(function(error){
            reject(error)
        })

    })

};

/**
     * 用户关联组织和角色
     * @param NewGroupObject: 新组织的对象
     * @param group_user: 请求api参数中的user
     * @param admin: 普通管理者组成的数组
     * @param group_admin: 组织管理者组成的数组
     * @param sessionToken: 调用api的用户的sessionToken
     */
var relateGroupRoleToUser = function (NewGroupObject,group_user,admin,group_admin,sessionToken){
    var buildObject = [];
    if(Array.isArray(admin)){
        buildObject.push(relate_GroupToUser(group_user, NewGroupObject, sessionToken));
        buildObject.push(relate_UserToRole(group_admin, NewGroupObject.id, "group_admin_"));
        buildObject.push(relate_UserToRole(admin, NewGroupObject.id, "admin_"));
    }else{
        buildObject.push(relate_GroupToUser(group_user, NewGroupObject, sessionToken));
        buildObject.push(relate_UserToRole(group_admin, NewGroupObject.id, "group_admin_"))  
    }
    return Promise.all(buildObject).then(function (result) {
        var addObject = [];
        result.forEach(function (current) {
            if(current.length>0)
                addObject = addObject.concat(current)
        });
        return AV.Object.saveAll(addObject,{'useMasterKey': true}).then(function () {
            return "success, relate to users successfully";
        }).catch(function(error){
            throw error
        });
    }).catch(function(error){
        throw error
    })
}

/**
     * 处理捕获的错误
     * @param error: 捕获的错误
     */
var dealBuildGroupErr= function(error){
        console.error('AccessLink-Platform /group/post#  build up group error',error);
        if(error.hasOwnProperty('message')) {
            if (error.message.indexOf('A unique field was given a value that is already taken') > -1) {
                throw(new AV.Error(403, 'The group name is occupied'));
            }
            else if (error.message.indexOf("Invalid value type for field 'name'") > -1) {
                throw(new AV.Error(403, 'Invalid group name'));
            }
            else if (error.message.indexOf("Invalid value type for field 'groupInfo'") > -1) {
                throw(new AV.Error(403, 'Invalid groupInfo'));
            }
            else if (error.message.indexOf('Forbidden to create by class') > -1) {
                throw(new AV.Error(401, 'no authority to build up group'));
            }
            else if (error.message.indexOf('this middle table data already exist') > -1) {
                throw(new AV.Error(401,'this group have already relate to these users'))
            }
            else if(error.message.indexOf('Invalid user')>-1){
                throw(new AV.Error(403, 'Invalid user'));
            }
            else {
                throw(new AV.Error(401, 'there is a server error'));
            }
        }
        else{
            throw(new AV.Error(401, 'there is a server error'));
        }
}

/**
     * 查找要删除的中间表GroupUserMap数据
     * @param User: 当前组织中包含的指定用户
     * @param currentGroup: 当前组织
     * @param sessionToken: 调用api的用户的sessionToken
     */
var find_delete_GroupUser = function (User,currentGroup,sessionToken) {
    var GroupUserMap_middleTable = new middleTable('GroupUserMap','Group','User',sessionToken);

    return new Promise(function (resolve,reject) {
        if(User.length > 0) {
            //get all users object by findValidUser function
            findValidUser(User, '_User', 'username').then(function (objectUsers) {
                async.map(objectUsers, function (currentUser, callback) {
                    // find the object which need to deleted in GroupUserMap table
                    GroupUserMap_middleTable.findData(currentGroup, currentUser).then(function (result) {
                        if (result.length == 0) {
                            reject(new AV.Error(404, 'error,could not find delete data'));
                        }
                        else {
                            callback(null, result[0]);
                        }
                    }, function (error) {
                        console.error('AccessLink-Platform /group/put#  find_delete_users error', error);
                        reject(new AV.Error(401, 'there is a server error'))
                    });
                }, function (err, result) {
                    //add all delete users object in deleteObject
                    console.error('AccessLink-Platform /group/put#  find_delete_users result', result);
                    resolve(result);
                });
            }, function (error) {
                reject(new AV.Error(401, 'there is a server error'))
            })
        }
        else{
            resolve([])
        }
    })

};

/**
     * 查找要删除的中间表GroupUserMap数据
     * @param User: 当前组织中包含的指定用户
     * @param currentGroup: 当前组织
     * @param sessionToken: 调用api的用户的sessionToken
     */
var dealEachGroup = function (current,sessionToken) {

    return new Promise(function (resolve,reject) {
        var currentGroupObject;
        var GroupOldName = current.name;
        var GroupNewName = current.newName;
        var newUserArr = current.user;
        var groupInfo = current.groupInfo;
        //get group object by group name filed
        var GroupQuery = new AV.Query('Group');
        GroupQuery.equalTo('name',GroupOldName);
        GroupQuery.find({'sessionToken': sessionToken}).then(function (result) {
            if(result.length == 0){
                reject(new AV.Error(404,'error,some group is not find'));
            }
            var addObject = [];
            var deleteObject = [];
            var dealObject = [];
            currentGroupObject = result[0];
            if (typeof GroupNewName != 'undefined') {
                currentGroupObject.set('name', GroupNewName);
            }
            if (typeof groupInfo != 'undefined') {
                currentGroupObject.set('groupInfo', groupInfo);
            }
            addObject.push(currentGroupObject);
            if(Array.isArray(newUserArr))
                dealObject.push(dealNewUserArr(currentGroupObject,newUserArr, sessionToken))
            //judge whether newUserArr,groupInfo At least one
            if(typeof newUserArr == 'undefined' && typeof groupInfo == 'undefined' && 
                typeof GroupNewName == 'undefined'){
                reject(new AV.Error(403,'error,newUserArr,groupInfo,GroupNewName At least one'));
            }
            // deal with the users in updateInfo
            Promise.all(dealObject).then(function(result) {
                result.forEach(function (current) {
                    if(current[0].length>0)
                        deleteObject = deleteObject.concat(current[0]);
                    if(current[1].length>0)
                        addObject = addObject.concat(current[1]);
                });
                resolve([deleteObject,addObject])
            },function (error) {
                reject(error)
            })

        }).catch(function (error) {
            reject(new AV.Error(401,'there is a server error'))
        });
    })
};

/**
     * 查找要删除的中间表GroupUserMap数据
     * @param User: 当前组织中包含的指定用户
     * @param currentGroup: 当前组织
     * @param sessionToken: 调用api的用户的sessionToken
     */
var dealNewUserArr = function (currentGroupObject,newUserArr,sessionToken) {
    var GroupUserMap_middleTable = new middleTable('GroupUserMap','Group','User',sessionToken);

    return new Promise(function (resolve,reject) {
        GroupUserMap_middleTable.findData(currentGroupObject).then(function (AllGroupUser) {
            async.map(AllGroupUser, function (current, callback) {
                var UserQuery = new AV.Query(AV.User);
                UserQuery.get(current.get('User').id,{'sessionToken': sessionToken}).then(function (result) {
                    callback(null, result.get('username'))
                }, function (error) {
                    reject(new AV.Error(401,'there is a server error'))
                });
            }, function (err, oldUserArr) {

                console.log("AccessLink-Platform /group/put# oldUserArr,newUserArr", oldUserArr,newUserArr);
                var UserDifference = ArrayFindDifference(oldUserArr, newUserArr);
                console.log("AccessLink-Platform /group/put# UserDifference", UserDifference);
                Promise.all([
                    find_delete_GroupUser(UserDifference.deleteArr, currentGroupObject, sessionToken),
                    relate_GroupToUser(UserDifference.addArr, currentGroupObject, sessionToken)
                ]).then(function (result) {
                    resolve(result)
                },function (error) {
                    reject(error)
                })

            })
        },function (error) {
            reject(new AV.Error(401,'there is a server error'))
        });
    })
};

function groupInterface(req) {

    var that = this;
    this.sessionToken = req.headers["sessiontoken"];
    this.originalUrl = req.originalUrl.split("?")[0];

    switch (req.method){
        case 'GET':
            paramArray = {
                skip:{type:"[object String]",default:"0"},
                limit:{type:"[object String]",default:"1000"},
                sortby:{type:"[object String]",default:"createdAt"},
                order:{type:"[object String]",default:"dsc"},
                name:{type:"[object Array]",default:[]}
            };
            if(this.originalUrl == "/v1/group/user" || this.originalUrl == "/v1/group/nodeId"){
                paramArray.name = {type:"[object String]",default:''}
            }
            for (var i in paramArray) {
                paramArray[i].value = req.query[i] == undefined ? paramArray[i]["default"] : req.query[i];
            }
            break;
        case 'POST':
            paramArray = {
                body:{type:"[object Array]",default:undefined}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.body == undefined ? paramArray[i]["default"] : req.body;
            }
            break;
        case 'PUT':
            paramArray = {
                body:{type:"[object Array]",default:undefined}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.body == undefined ? paramArray[i]["default"] : req.body;
            }
            break;
        case 'DELETE':
            paramArray = {
                name:{type:"[object Array]",default:undefined}
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
            if(Object.prototype.toString.call(paramsArray[i].value)!=paramsArray[i].type){
                throw new AV.Error(403,"error, invalid param in " + i);
            }
        }
        return 'true'
    };

    this.paramsCheck = function(){
        switch (req.method){
            case 'GET':
                if(this.originalUrl == "/v1/group/user" || this.originalUrl == "/v1/group/nodeId"){
                    if(!req.query.name){
                            throw new AV.Error(403,"error, miss group name")
                    };
                }
                break;
            case 'POST':
                req.body.forEach(function(val){
                    if(!val.name){
                        throw new AV.Error(403,"error, miss group name")
                    }
                    if(!val.user && !val.groupInfo){
                        throw new AV.Error(403,"error, params include user or groupInfo at least one")
                    }

                    if(val.user){
                        if(Object.prototype.toString.call(val.user)!="[object Array]"){
                            throw new AV.Error(403,"Invalid user")
                        }   
                    }

                });
                break;
            case 'PUT':
                req.body.forEach(function(val){

                    if(!val.name){
                        throw new AV.Error(403,"error, miss group name")
                    }else if(Object.prototype.toString.call(val.name)!="[object String]"){
                        throw new AV.Error(403,"error, invalid param in name")
                    }
                    if(!val.user && !val.groupInfo && !val.newName){
                        throw new AV.Error(403,"error, params include newName,user groupInfo at least one")
                    }else{
                        if(val.user){
                            if(Object.prototype.toString.call(val.user)!="[object Array]"){
                                throw new AV.Error(403,"error, invalid param in user")
                            }   
                        }
                        if(val.groupInfo){
                            if(Object.prototype.toString.call(val.groupInfo)!="[object String]"){
                                throw new AV.Error(403,"error, invalid param in groupInfo")
                            }
                        }
                        if(val.newName){
                            if(Object.prototype.toString.call(val.newName)!="[object String]"){
                                throw new AV.Error(403,"error, invalid param in newName")
                            }
                        }
                    }
                });
                break;
        }
        return true
    }

    this.getGroup = function (select) {
        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;
        var sortby = this.paramArray.sortby.value;
        var order = this.paramArray.order.value;
        var queryArrName = this.paramArray.name.value;
        var queryGroup = new AV.Query('Group');
        if(queryArrName.length >0){
            queryGroup.containedIn('name',queryArrName);
        }
        if(order == "dsc"){
            queryGroup.descending(sortby);
        }else{
            queryGroup.addAscending(sortby)
        }
        if(typeof select != 'undefined'){
            queryGroup.select(select)
        }
        queryGroup.limit(limit);
        queryGroup.skip(skip);

        return queryGroup.find({'sessionToken': this.sessionToken})
    };

    this.getGroupByname = function(){
        var queryArrName = this.paramArray.name.value;
        var queryGroup = new AV.Query('Group');
        if(queryArrName.length >0){
            queryGroup.equalTo('name',queryArrName);
        }
        return queryGroup.first({'sessionToken': this.sessionToken})
    }

    this.getMidGroupUser = function(group){
        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;
        console.log("this.paramArray",this.paramArray)

        return new Promise(function(resolve, reject){
                var queryGroupUser = new AV.Query('GroupUserMap');
                queryGroupUser.equalTo("Group", group);
                queryGroupUser.include("User");
                queryGroupUser.limit(limit);
                queryGroupUser.skip(skip);
                queryGroupUser.find({'sessionToken': that.sessionToken}).then(function(midGroupUser){
                    var midUsers = []
                    midGroupUser.forEach(function(val){
                        midUsers.push(val.get('User').toJSON())
                    })
                    resolve(midUsers)
                }).catch(function(err){
                    reject(err)
                })

        })
    }

    this.getNode = function(group){
        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;

        return new Promise(function(resolve, reject){
                var queryGroupNode = new AV.Query('NodeInfo');
                // if group is undefined set it ''
                queryGroupNode.equalTo("Group", typeof group == 'undefined'?'':group);
                queryGroupNode.limit(limit);
                queryGroupNode.skip(skip);
                queryGroupNode.find({'sessionToken': that.sessionToken}).then(function(nodes){
                    var resNodes = [];
                    nodes.forEach(function(val){
                        resNodes.push(val.toJSON())
                    })
                    resolve(resNodes)
                }).catch(function(err){
                    reject(err)
                })
        })

    }

    this.getGroupCount = function () {
        var queryGroup = new AV.Query('Group');
        return queryGroup.count({'sessionToken': this.sessionToken})
    };

    this.buildAllGroup = function () {
        return new Promise(function (resolve,reject) {
            var postInfo = that.paramArray.body.value;
            async.map(postInfo,function (groupParams,callback) {

                findValidUser(groupParams.user, '_User', 'username').then(function (objectUsers) {
                    //make sure all Users are right and findValidUser successfully
                    if (groupParams.user == undefined || (objectUsers.length > 0 && objectUsers.length == groupParams.user.length)) {
                    }
                    else {
                        // reject(new AV.Error(403, 'Invalid user'))
                        throw(new AV.Error(403, 'Invalid user'))
                    }
                }).then(function(){
                    return buildUpOneGroup(groupParams, that.sessionToken)
                }).then(function(request){
                    return buildNewGroupRole(request)
                }).then(function(group){
                    var admin = groupParams.user;
                    var group_admin = [that.login_username];
                    var group_user;
                    if(Array.isArray(admin)){
                        group_user = admin.concat(that.login_username);
                    }else{
                        group_user = [that.login_username]
                    }
                    return relateGroupRoleToUser(group,group_user,admin,group_admin, that.sessionToken)
                }).catch(function(error){
                    return dealBuildGroupErr(error)
                }).then(function (result) {
                    callback(null,result)
                },function (error) {
                    reject(error)
                })
            },function (error,result) {
                resolve('success')
            })
        });
    };



    this.updateAllGroup = function () {

        return new Promise(function (resolve,reject) {
            var updateInfo = that.paramArray.body.value;
            if(updateInfo.length == 0){
                throw new AV.Error(403,'Invalid updateInfo');
            }
            async.map(updateInfo, function (current,callback) {
                //deal with one group
                if(typeof current.name != 'undefined'){
                    dealEachGroup(current,that.sessionToken).then(function (result) {
                        callback(null,result);
                    },function (error) {
                        reject(error)
                    })
                }
                else {
                    reject(new AV.Error(403,'lack update Group name'));
                }
            }, function (err,result) {
                var addObject = [];
                var deleteObject = [];
                result.forEach(function (current) {
                    if(current[0].length>0)
                        deleteObject = deleteObject.concat(current[0]);
                    if(current[1].length>0)
                        addObject = addObject.concat(current[1]);
                });
                AV.Object.destroyAll(deleteObject,{'sessionToken':that.sessionToken}).then(function () {
                    return AV.Object.saveAll(addObject,{'sessionToken':that.sessionToken}).then(function () {
                        resolve('success, update success')
                    });
                }).catch(function (error) {
                    console.error("AccessLink-Platform /group/put#  update group error",error);
                    if(error.hasOwnProperty('message')) {

                        if (error.message.indexOf('A unique field was given a value that is already taken') > -1) {
                            reject(new AV.Error(403, 'The group name is occupied'));
                        }
                        else if (error.message.indexOf("Invalid value type for field 'name'") > -1) {
                            reject(new AV.Error(403, 'Invalid group name'));
                        }
                        else if (error.message.indexOf("Invalid value type for field 'groupInfo'") > -1) {
                            reject(new AV.Error(403, 'Invalid groupInfo'));
                        }
                        else if (error.message.indexOf('this middle table data already exist') > -1) {
                            reject(new AV.Error(401,'this group have already relate to these users'))
                        }
                        else if (error.message.indexOf('Forbidden to update by class') > -1) {
                            reject(new AV.Error(401, 'no authority to update group'));
                        }
                        else if (error.message.indexOf('Forbidden to delete by class') > -1) {
                            reject(new AV.Error(401, 'no authority to update group'));
                        }
                        else if (error.message.indexOf("Forbidden writing by object's ACL") > -1) {
                            reject(new AV.Error(401, 'no authority to update group'));
                        }
                        else {
                            reject(new AV.Error(401, 'there is a server error'));
                        }

                    }
                    else{
                        reject(new AV.Error(401, 'there is a server error'));
                    }
                });
            });

        })
    };

    var findEachGroup = function (GroupName) {

        var deleteObject = [];
        return new Promise(function (resolve,reject) {
            var GroupQuery = new AV.Query('Group');
            GroupQuery.equalTo('name', GroupName);
            GroupQuery.find({'sessionToken':that.sessionToken}).then(function (group) {
                if(group.length == 0){
                    throw new AV.Error(404,'error,some group not find');
                }
                deleteObject = deleteObject.concat(group);
                resolve(deleteObject);
            }).catch(function (error) {
                if(error.message.indexOf('error,some group not find')> -1){
                    reject(new AV.Error(404,'error,some group not find'))
                }
                else{
                    reject(new AV.Error(401,'there is a server error'))
                }
            });
        })
    };

    var findAllGroup = function (ArrParam) {
        var deleteObject = [];
        return new Promise(function (resolve,reject) {
            async.map(ArrParam, function (value, callback) {
                findEachGroup(value).then(function (result) {
                    callback(null,result);
                },function (error) {
                    console.error('AccessLink-Platform /group/delete# findEachGroup find error',error);
                    reject(error);
                })
            }, function (error,result) {
                result.forEach(function (current) {
                    deleteObject = deleteObject.concat(current)
                });
                resolve(deleteObject);
            });
        })
    };

    this.deleteAllGroup = function () {

        return new Promise(function (resolve,reject) {
            var bodyName = that.paramArray.name.value;
            if(bodyName.length == 0){
                throw new AV.Error(403,'Invaild name');
            }
            findAllGroup(bodyName).then(function (deleteInfo) {
                return AV.Object.destroyAll(deleteInfo,{'sessionToken':that.sessionToken}).then(function () {
                    resolve("success, delete success");
                },function (error) {
                    if(error.hasOwnProperty('message')) {
                        if (error.message.indexOf('Forbidden to delete by class') > -1) {
                            reject(new AV.Error(401, 'no authority to delete group'));
                        }
                        else if (error.message.indexOf("Forbidden writing by object's ACL") > -1) {
                            reject(new AV.Error(401, 'no authority to delete group'));
                        }
                        else
                        {
                            reject(new AV.Error(401, 'there is a server error'));
                        }
                    }
                    else{
                        reject(new AV.Error(401, 'there is a server error'));
                    }
                });
            },function (error) {
                console.error("AccessLink-Platform /group/delete# findAllGroup error",error);
                reject(error)
            });
        })

    }

}
module.exports = groupInterface;