var AV = require('leancloud-storage');
var async = require('async');
var ArrayFindDifference = require('../../lib/ArrayFindDifference');
var setDataAcl = require('../../lib/setAcl');
var middleTable = require('../../lib/middleTable');

function userModule(req) {

    var that = this;
    this.sessionToken = req.headers["sessiontoken"];

    var GroupUserMap_middleTable = new middleTable('GroupUserMap','Group','User',undefined,true);

    switch (req.method){
        case 'GET':
            paramArray = {
                skip:{type:"[object String]",default:"0"},
                limit:{type:"[object String]",default:"1000"},
                sortby:{type:"[object String]",default:"createdAt"},
                order:{type:"[object String]",default:"dsc"},
                username:{type:"[object Array]",default:[]}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.query[i] == undefined ? paramArray[i]["default"] : req.query[i];
            }
            break;
        case 'POST':
            paramArray = {
                username:{type:"[object String]",default:""},
                password:{type:"[object String]",default:""},
                group:{type:"[object String]",default:undefined},
                userInfo:{type:"[object String]",default:undefined},
                email:{type:"[object String]",default:undefined},
                phone:{type:"[object String]",default:undefined}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.body[i] == undefined ? paramArray[i]["default"] : req.body[i];
            }
            break;
        case 'PUT':
            paramArray = {
                username:{type:"[object String]",default:""},
                newName:{type:"[object String]",default:undefined},
                group:{type:"[object String]",default:undefined},
                userInfo:{type:"[object String]",default:undefined},
                email:{type:"[object String]",default:undefined},
                phone:{type:"[object String]",default:undefined}
            };
            for (var i in paramArray) {
                paramArray[i].value = req.body == undefined ? paramArray[i]["default"] : req.body[i];
            }
            break;
        case 'DELETE':
            paramArray = {
                username:{type:"[object Array]",default:undefined}
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
            if(paramsArray[i].value != undefined && Object.prototype.toString.call(paramsArray[i].value)!=paramsArray[i].type){
                throw new AV.Error(403,"error, invalid param in " + i);
            }
        }
        return 'true'
    };

    this.paramCheck = function(){
        switch (req.method){
            case 'POST':
                var val = req.body;
                if(!val.username){
                    throw new AV.Error(403,"error, miss username")
                }
                if(!val.password){
                    throw new AV.Error(403,"error, miss password")
                }
                if(!val.username && !val.password){
                    throw new AV.Error(403,"error, miss username and password")
                }
                break;
            case 'PUT':
                var val = req.body;
                if(!val.username){
                    throw new AV.Error(403,"error, miss username")
                }
                if(req.originalUrl.split("?")[0]=="/v1/user"){
                    if(!val.newName && !val.group && !val.userInfo && !val.email && !val.phone){
                        throw new AV.Error(403,"error, params include newName,group,userInfo,email,phone at least one")
                    } 
                }
                if(req.originalUrl.split("?")[0]=="/v1/user/name"){
                    if(!val.newName){
                        throw new AV.Error(403,"error, miss newName")
                    } 
                }
                if(req.originalUrl.split("?")[0]=="/v1/user/password"){
                    if(!val.oldPassword){
                        throw new AV.Error(403,"error, miss oldPassword")
                    } 
                    if(!val.newPassword){
                        throw new AV.Error(403,"error, miss newPassword")
                    } 
                }
                if(req.originalUrl.split("?")[0]=="/v1/user/verify"){
                    if(!val.email && !val.phone){
                        throw new AV.Error(403,"error, params include email,phone at least one")
                    } 
                }
                break;
            case 'DELETE':
                var val = req.query;
                if(!val.username){
                    throw new AV.Error(403,"error, miss username")
                }
        }
        return true   
    }

    this.getUserInfo = function (select) {
        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;
        var sortby = this.paramArray.sortby.value;
        var order = this.paramArray.order.value;
        var username = this.paramArray.username.value;
        var queryUser = new AV.Query('_User');
        if(username.length >0){
            queryUser.containedIn('username', username);
        }
        if(typeof select != 'undefined'){
            queryUser.select(select)
        }
        if(order == "dsc"){
            queryUser.descending(sortby);
        }else{
            queryUser.addAscending(sortby)
        }
        queryUser.limit(limit);
        queryUser.skip(skip);

        return queryUser.find({'sessionToken': this.sessionToken})
    };
    
    this.getUserGroupInfo = function () {
        var skip = this.paramArray.skip.value;
        var limit = this.paramArray.limit.value;
        var sortby = this.paramArray.sortby.value;
        var order = this.paramArray.order.value;
        var username = this.paramArray.username.value;
        var queryGroupUserMap = new AV.Query('GroupUserMap');
        var queryUser = new AV.Query(AV.User);
        if(username.length >0){
            queryUser.containedIn('username',username);
        }
        queryGroupUserMap.matchesQuery('User',queryUser);
        queryGroupUserMap.include('Group');
        queryGroupUserMap.include('User');
        if(order == "dsc"){
            queryGroupUserMap.descending(sortby);
        }else{
            queryGroupUserMap.addAscending(sortby)
        }
        queryGroupUserMap.limit(limit);
        queryGroupUserMap.skip(skip);

        return queryGroupUserMap.find({'sessionToken': this.sessionToken})
    };

    this.getUserCount = function () {
        var userQuery = new AV.Query(AV.User);
        return userQuery.count({'sessionToken': this.sessionToken})
    };

    var add_authority = function (roleName,loginedUser) {
        return new Promise(function (resolve,reject) {
            var roleQuery = new AV.Query(AV.Role);
            roleQuery.equalTo('name', roleName);
            roleQuery.find({useMasterKey: true}).then(function (results) {
                if(results.length == 0){
                    reject(new AV.Error(404, 'role not found or no authority'))
                }else{
                    var administratorRole = results[0];
                    var relation = administratorRole.getUsers();
                    relation.add(loginedUser);
                    resolve(administratorRole);
                }
            }).catch(function (error) {
                console.error('AccessLink-Platform /user/post#  get role error', error);
                reject(new AV.Error(404, 'role not found or no authority'))
            })
        })

    };

    var remove_authority = function (currentUser) {
        return new Promise(function (resolve,reject) {
            var roleQuery = new AV.Query(AV.Role);
            roleQuery.equalTo('users', currentUser);
            roleQuery.find({'sessionToken':that.sessionToken}).then(function (role) {
                async.map(role,function (current,callback) {
                    var roleQuery = new AV.Query(AV.Role);
                    roleQuery.equalTo('name', current.get('name'));
                    roleQuery.find({'sessionToken':that.sessionToken}).then(function (role) {
                        role.forEach(function (current) {
                            var relation= current.getUsers();
                            relation.remove(currentUser);
                        });
                        callback(null,role);
                    },function (error) {
                        reject(new AV.Error(401,'there is a server error'))
                    })
                },function (error,result) {
                    AV.Object.saveAll(result,{useMasterKey: true}).then(function () {
                        resolve('success')
                    })
                })
            }).catch(function (error) {
                console.error("AccessLink-Platform /user/group put remove_authority error",error);
                reject(new AV.Error(401,'there is a server error'))
            })
        })
    };

    this.relationGroup = function(newuser){
        var current = req.body;
        return new Promise(function (resolve,reject) {
            if(current.group != undefined){
                return that.findGroup(current.group).then(function(groups){
                    if(groups.length == 0){
                        throw(new AV.Error(404, 'group not found'));
                    }else{
                        return that.relateUserToGroup(newuser, groups).then(function(result){         
                            var addObject = [];
                            result.forEach(function (current) {
                                addObject = addObject.concat(current);
                            });
                            AV.Object.saveAll(addObject,{useMasterKey: true}).then(function () {
                                resolve(newuser)
                            },function (error) {
                                if(error.hasOwnProperty('message')) {
                                    if (error.message.indexOf('this middle table data already exist') > -1) {
                                        reject(new AV.Error(401,'you have already related to this group'))
                                    }
                                    else{
                                        reject(new AV.Error(401,'there is a server error'))
                                    }
                                }
                                else{
                                    reject(new AV.Error(401,'there is a server error'))
                                }
                            })

                        })
                    }
                }).catch(function(error){
                    reject(error)
                })
            }else{
                resolve(newuser)
            }
        })
    }

    this.setUserACL = function(user){
        return new Promise(function(resolve, reject){
            var tableQuery = new AV.Query("GroupUserMap");
            tableQuery.equalTo("User", user);
            tableQuery.find({useMasterKey: true}).then(function(findResult){
                var roleAcl = new AV.ACL();
                roleAcl.setRoleWriteAccess('super_admin', true);
                roleAcl.setRoleReadAccess('super_admin', true);
                roleAcl.setWriteAccess(user.id, true);
                roleAcl.setReadAccess(user.id, true);
                if(findResult.length > 0){
                    console.log("AccessLink-Platform find group to setACL", findResult[0].toJSON().Group.objectId)
                    roleAcl.setRoleReadAccess('group_admin_' + findResult[0].toJSON().Group.objectId, true);
                }
                user.set('ACL', roleAcl);
                user.save(null,{useMasterKey: true}).then(function(){
                    resolve()
                }).catch(function(err){
                    reject(err)
                })
            })
        })
    }

    this.buildUser = function () {
        var currentBuild = that.paramArray;
        return new Promise(function (resolve,reject) {
            var username = currentBuild.username.value;
            var password = currentBuild.password.value;
            var userInfo = currentBuild.userInfo.value;
            var email = currentBuild.email.value;
            var phone = currentBuild.phone.value;

            var user = new AV.User();
            user.setUsername(username);
            user.setPassword(password);

            if(typeof userInfo !=undefined){
                user.set('userInfo',userInfo);
            }
            if(typeof email !=undefined){
                user.setEmail(email);
            }
            if(typeof phone !=undefined){
                user.setMobilePhoneNumber(phone);
            }
            user.signUp(null,{useMasterKey: true}).then(function (newuser) {
                resolve(newuser)
            }).catch(function (error) {
                console.error('AccessLink-Platform /user#  build up new user error',error);
                if(error.hasOwnProperty('message')) {
                    if (error.message.indexOf('Forbidden to create by class') > -1) {
                        reject(new AV.Error(401, 'no authority to create user'));
                    }
                    else if (error.message.indexOf('Username has already been taken') > -1) {
                        reject(new AV.Error(403, 'Username has already been taken'));
                    }
                    else if (error.message.indexOf('此电子邮箱已经被占用') > -1) {
                        reject(new AV.Error(403, 'email has been occupied'));
                    }
                    else if (error.message.indexOf('The email address was invalid') > -1) {
                        reject(new AV.Error(403, 'The email address was invalid'));
                    }
                    else if (error.message.indexOf('Mobile phone number has already been taken') > -1) {
                        reject(new AV.Error(403, 'Mobile phone number has already been taken'));
                    }
                    else if (error.message.indexOf('无效的手机号码') > -1) {
                        reject(new AV.Error(403, 'Mobile phone number is invalid'));
                    }
                    else if (error.message.indexOf("Invalid value type for field 'userInfo'") > -1) {
                        reject(new AV.Error(403, 'Invalid userInfo'));
                    }
                    else if (error.message.indexOf("Invalid value type for field 'email'") > -1) {
                        reject(new AV.Error(403, 'Invalid email'));
                    }
                    else if (error.message.indexOf("Invalid value type for field 'phone'") > -1) {
                        reject(new AV.Error(403, 'Invalid phone'));
                    }
                    else if (error.message.indexOf("group not found") > -1) {
                        reject(new AV.Error(404, 'group not found'));
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

        })
    }

    this.findGroup  = function(groupName){
        return new Promise(function(resolve,reject){
            var currentGroup;
            var groupQuery = new AV.Query('Group');
            groupQuery.equalTo('name', groupName);
            groupQuery.find({useMasterKey: true}).then(function(groups){
                if(groups.length == 0){
                    reject(new AV.Error(404, 'group not found'))
                }else{
                    resolve(groups)
                }
            }).catch(function(error){
                reject(new AV.Error(401, 'there is a server error'))
            })

        })
    }

    this.relateUserToGroup = function(currentBuildUser, groups){
        return new Promise(function(resolve,reject){
            var currentGroup;
            currentGroup = groups[0];
            add_authority('admin' + '_' + groups[0].id, currentBuildUser).then(function(newAuthority){
                var addObject = [];
                addObject.push(newAuthority);
                addObject.push(GroupUserMap_middleTable.buildOneData(currentGroup, currentBuildUser));
                resolve(addObject)
            }).catch(function(error){
                reject(new AV.Error(403, 'add_authority error'))
            })

        })
    }

    this.updateUser = function(){
        return that.updateUser_personal_Info().then(function (updateuser) {
            var group = req.body.group;
            if(group != undefined){
                return that.findGroup(group).then(function(groups){
                    if(groups.length == 0){
                        throw(new AV.Error(404, 'group not found'));
                    }else{
                        remove_authority(updateuser);
                        GroupUserMap_middleTable.findData(undefined, updateuser).then(function (result) {
                            return AV.Object.destroyAll(result,{useMasterKey:true}).then(function (res) {
                            });
                        })
                        return that.relateUserToGroup(updateuser, groups)
                    }
                })
            }else{
                return [updateuser]
            }
        }).then(function(result){
            var addObject = [];
            result.forEach(function (current) {
                addObject = addObject.concat(current);
            });
            AV.Object.saveAll(addObject,{useMasterKey: true}).then(function () {
                resolve('success')
            },function (error) {
                if(error.hasOwnProperty('message')) {
                    if (error.message.indexOf('this middle table data already exist') > -1) {
                        reject(new AV.Error(401,'you have already related to this group'))
                    }
                    if (error.message.indexOf('The user cannot be altered by other users or with outdated session') > -1) {
                        reject(new AV.Error(401,'no authority to update the user'))
                    }
                    else{
                        reject(new AV.Error(401,'there is a server error'))
                    }
                }
                else{
                    reject(new AV.Error(401,'there is a server error'))
                }
            })
        }).catch(function(err){
            return DealUpdateUserError(err)
        })
    }

    this.updateUser_personal_Info = function () {
        return new Promise(function (resolve,reject) {
            var updateInfo = req.body;
            var username = updateInfo.username;
            if(typeof username != 'string'){
                throw new AV.Error(401,'Invalid username')
            }
            var newName = updateInfo.newName;
            var userInfo = updateInfo.userInfo;
            var email = updateInfo.email;
            var phone = updateInfo.phone;
            var group = updateInfo.group;
            if(typeof userInfo == 'undefined' && typeof email == 'undefined'
                && typeof phone == 'undefined' && typeof newName == 'undefined'
                && typeof group == 'undefined') {
                throw new AV.Error(401,'At least one updateInfo param')
            }
            var userQuery = new AV.Query('_User');
            userQuery.equalTo('username',username);
            userQuery.find({'sessionToken': that.sessionToken}).then(function (result) {
                if(result.length == 0){
                    throw new AV.Error(404,'user not found or no authority')
                }
                result[0].set('userInfo',userInfo);
                result[0].setEmail(email);
                result[0].setMobilePhoneNumber(phone);
                return result[0].save(null,{'sessionToken': that.sessionToken})
            }).then(function(updateuser){
                resolve(updateuser)
            }).catch(function(err){
                reject(err)
            })
        })
    };

    var DealUpdateUserError = function (error) {
        console.error('AccessLink-Platform /user#  build up new user error',error)
        if(error.hasOwnProperty('message')) {
            if (error.message.indexOf('Forbidden to update by class') > -1) {
                throw(new AV.Error(401, 'no authority to update user'));
            }
            else if (error.message.indexOf('The user cannot be altered by other users or with outdated session') > -1) {
                throw(new AV.Error(401,'no authority to update the user'))
            }
            else if (error.message.indexOf('Username has already been taken') > -1) {
                throw(new AV.Error(403, 'Username has already been taken'));
            }
            else if (error.message.indexOf('此电子邮箱已经被占用') > -1) {
                throw(new AV.Error(403, 'email has been occupied'));
            }
            else if (error.message.indexOf('Mobile phone number has already been taken') > -1) {
                throw(new AV.Error(403, 'Mobile phone number has already been taken'));
            }
            else if (error.message.indexOf("Invalid value type for field 'userInfo'") > -1) {
                throw(new AV.Error(403, 'Invalid userInfo'));
            }
            else if (error.message.indexOf("Invalid value type for field 'email'") > -1) {
                throw(new AV.Error(403, 'Invalid email'));
            }
            else if (error.message.indexOf("Invalid value type for field 'phone'") > -1) {
                throw(new AV.Error(403, 'Invalid phone'));
            }
            else if (error.message.indexOf("group not found") > -1) {
                throw(new AV.Error(404, 'group not found'));
            }
            else
            {
                throw(new AV.Error(401, 'there is a server error'));
            }
        }
        else{
            throw(new AV.Error(401, 'there is a server error'));
        }
    }

    this.updateOneUserName_ByName = function () {
        return new Promise(function (resolve,reject) {
            var updateInfo = req.body;
            var UserOldName = updateInfo.username;
            var UserNewName = updateInfo.newName;
            console.log("old and new name",UserOldName,UserNewName)
            if(typeof UserOldName != 'string'){
                throw new AV.Error(403,'Invalid username')
            }
            if(typeof UserNewName != 'string'){
                throw new AV.Error(403,'Invalid newName')
            }
            var GroupQuery = new AV.Query('_User');
            GroupQuery.equalTo('username',UserOldName);
            GroupQuery.find({'sessionToken':that.sessionToken}).then(function (result) {
                if(result.length == 0){
                    reject(new AV.Error(404,'User not find'));
                }
                else{
                    result[0].setUsername(UserNewName);
                    return result[0].save(null,{'sessionToken':that.sessionToken})
                }
            }).then(function () {
                resolve("success, update username successfully")
            }).catch(function (error) {
                if(error.hasOwnProperty('message')) {
                    if (error.message.indexOf('Forbidden to update by class') > -1) {
                        reject(new AV.Error(401, 'no authority to update user'));
                    }
                    else if (error.message.indexOf('The user cannot be altered by other users or with outdated session') > -1) {
                        reject(new AV.Error(401,'no authority to update the user'))
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

    this.updateUserPassword = function () {
        return new Promise(function (resolve,reject) {
            var updateInfo = req.body;
            var username = updateInfo.username;
            var oldPassword = updateInfo.oldPassword;
            var newPassword = updateInfo.newPassword;
            if(typeof username != 'string'){
                throw new AV.Error(403,'Invalid username')
            }
            if(typeof oldPassword != 'string'){
                throw new AV.Error(403,'Invalid oldPassword')
            }
            if(typeof newPassword != 'string'){
                throw new AV.Error(403,'Invalid newPassword')
            }
            AV.User.logIn(username, oldPassword).then(function (loginedUser) {
                return loginedUser.updatePassword(oldPassword,newPassword,{'sessionToken':that.sessionToken}).then(function () {
                    resolve("success, update username successfully")
                });
            }).catch(function (error) {
                if(error.hasOwnProperty('message')) {
                    if (error.message.indexOf('The username and password mismatch') > -1) {
                        reject(new AV.Error(401,'The username and password mismatch'))
                    }
                    else if (error.message.indexOf('The user cannot be altered by other users or with outdated session') > -1) {
                        reject(new AV.Error(401,'no authority to update the user'))
                    }
                    else{
                        reject(new AV.Error(401,'there is a server error'))
                    }
                }
                else{
                    reject(new AV.Error(401,'there is a server error'))
                }
            });
        })
    }

    this.verifyEmailPhone = function() {
        return new Promise(function (resolve,reject) {
            var verifyInfo = req.body;
            var email = verifyInfo.email;
            //Todo: verify by phone  
            var phone = verifyInfo.phone;
            if(email == undefined){
                throw new AV.Error(403,'miss email')
            }else{
                AV.User.requestEmailVerify(email).then(function(scs){
                    resolve()
                }).catch(function(err){
                    reject(err)
                });
            }

        })        
    }

    var findOneUser = function (username) {
        var deleteObject = [];
        var current_user;
        return new Promise(function (resolve,reject) {
            AV.User.become(that.sessionToken).then(function (result) {
                current_user = result.toJSON().username;
                var RoleQuery = new AV.Query(AV.Role);
                RoleQuery.equalTo('users',result);
                return RoleQuery.find({'sessionToken': that.sessionToken});
            }).then(function (role) {
                var roleName = "";
                role.forEach(function(val){
                    if(val.get('name').indexOf('super_admin')>-1){
                        roleName = "super_admin";
                    }
                })
                if(roleName == "super_admin" || current_user == username){
                    var userQuery = new AV.Query('_User');
                    userQuery.equalTo('username', username);
                    return userQuery.find({'sessionToken':that.sessionToken}).then(function (userObject) {
                        if(userObject.length == 0){
                            reject(new AV.Error(404,'some user not find'));
                        }
                        deleteObject.push(userObject[0]);
                        resolve(deleteObject);
                    });
                }
                else{
                    throw new AV.Error(401,'no authority to delete user');
                }
            }).catch(function (error) {
                if(error.hasOwnProperty('message')) {
                    if (error.message.indexOf('no authority to delete user') > -1) {
                        reject(new AV.Error(401,'no authority to delete user'))
                    }
                    else {
                        reject(new AV.Error(401,'there is a server error'))
                    }
                }
                else{
                    reject(new AV.Error(401,'there is a server error'))
                }

            })
        });
    };

    var findAllUser = function (ArrParam) {
        return new Promise(function (resolve,reject) {
            async.map(ArrParam, function (value, callback) {
                console.log('AccessLink-Platform /user/delete# findAllUser currentUser',value);
                findOneUser(value).then(function (result) {
                    callback(null,result);
                },function (error) {
                    console.error('AccessLink-Platform /user/delete# findAllUser find error',error);
                    reject(error);
                })
            }, function (error,result) {
                console.log('AccessLink-Platform /user/delete# findAllUser result',result);
                var deleteObject = [];
                result.forEach(function (current) {
                    deleteObject = deleteObject.concat(current)
                });
                resolve(deleteObject);
            });
        })
    };

    this.deleteAllUser = function () {
        var usernames = that.paramArray.username.value;
        return new Promise(function (resolve,reject) {
            findAllUser(usernames).then(function (deleteInfo) {
                console.log("AccessLink-Platform /user/delete# deleteInfo",deleteInfo,deleteInfo.length);
                AV.Object.destroyAll(deleteInfo,{useMasterKey:true}).then(function () {
                    resolve("success, delete success");
                }, function (error) {
                    console.error("AccessLink-Platform /user/delete# delete error",error);
                    reject(error)
                });
            },function (error) {
                console.error("AccessLink-Platform /user/delete# findAllUser error",error);
                reject(error)
            });
        })

    }

}
module.exports = userModule;