import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppPUT, AppGET, AppPOST, AppDELETE, AppLogin} from "../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../lib/sort"
import querystring = require('querystring');
import * as AV from 'leancloud-storage';
import { UserGroupGetParameter, UserGroupPostParameter, UserGroupPutParameter} from "./lib/parameter"

const devurl = "localhost"
const appkey = require('../config').AppKey
const masterKey = require('../config').MasterKey
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const userPath = "/v1/user/group"
const port = parseInt(process.env.PORT || require("../config").port)
class _User extends AV.Object {}
AV.Object.register(_User)
try{
	AV.init({
		appId: appID,
		appKey: appkey,
		masterKey: masterKey
	})
}
catch(e){
	console.error("Check init error:", e)
}

describe('Get /v1/user/group', () => {
	let sessionToken = require('../config').sessionToken.test_super

	it("default parameters should return 1000 user data", (done) => {
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET("", (data: any, statusCode: number) => {
			data.length.should.equal(1000)
			statusCode.should.equal(200)
			data.forEach(function(value){
				value.should.have.property("Group")
			})
			//Check if sortby created time and use descend
			done()
		})
	})

	it("use limit 20 & should return 20 user data", (done) => {		
		let getParameter: UserGroupGetParameter = {
			limit: 20
		}
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			data.length.should.equal(20)
			statusCode.should.equal(200)
			data.forEach(function(value){
				value.should.have.property("Group")
			})
			done()
		})
	})

	it("use limit 20 and skip 20 & should return 20 user data with 20 skip", (done) => {
		console.log("Get 40 data at first")
		let getParameter: UserGroupGetParameter = {
			limit: 40
		}
		let userGroupGet = new AppGET(devurl, userPath, port)
		let dataA: any
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			data.length.should.equal(40)
			statusCode.should.equal(200)
			data.forEach(function(value){
				value.should.have.property("Group")
			})
			dataA = data
			userGroupGet1Test()
		})

		console.log("Skip 20 data and get 20 data, then compare")
		let getParameter1: UserGroupGetParameter = {
			limit: 20,
			skip: 20
		}
		let userGroupGet1 = new AppGET(devurl, userPath, port)
		userGroupGet1.setSessionToken(sessionToken)
		function userGroupGet1Test(){
			userGroupGet1.GET((data: any, statusCode: number) => {
				data.length.should.equal(20)
				statusCode.should.equal(200)
				data.forEach(function(value){
					value.should.have.property("Group")
				})
				expect(data).to.eql(dataA.slice(-20))
				done()
			})
		}
	})

	it("use username 'test' and 'test_1' to filter data & should only return sepcify user data", (done) => {
		let getParameter: UserGroupGetParameter = {
			username: ["testUser", "test_1"]
		}
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach((value, i) => {
				value.should.have.property('Group')
				value.User.should.satisfy((username) => {
					if(username == getParameter.username[0] || username == getParameter.username[1]) {
						return true;	
					}
					else {
						return false;
					}
				})
			})
			done();
		})
	})

	it("use sortby to sort date by username, createTime & should only return be sorted data", (done) => {
		let sortArray: Array<string> = [];
		function sortCheck(sortby: string) {
			let getParameter: UserGroupGetParameter = {
				sortby: sortby
			}
			let userGroupGet = new AppGET(devurl, userPath, port)
			userGroupGet.setSessionToken(sessionToken)
			userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
				statusCode.should.equal(200)
				data.forEach(function(value){
					value.should.have.property("Group")
				})
				sortCommonCheck(data, "dsc", sortby)
				sortArray.push(sortby)
				if(sortArray.indexOf("name") >= 0 && sortArray.indexOf("createTime") >= 0){
					done()
				}
			})		
		}

		console.log("sortby name")
		sortCheck("name")

		console.log("sortby createTime")
		sortCheck("createTime")
	})

	it("use order as asc & should return data sort as ascend", (done) => {
		let getParameter: UserGroupGetParameter = {
			order: "asc"
		}
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach(function(value){
				value.should.have.property("Group")
			})
			sortDateCheck(data, getParameter.order, "createdAt")
			done();
		})
	})

	it("Comprehensive test & should return data limit 100 with skip 10, filter data use username as 'user1' , sortby username order as ascend", (done) => {
		console.log("Get 110 data at first")
		let dataA: any
		let getParameter: UserGroupGetParameter = {
			limit: 110,
			sortby: "username",
			order: "asc"
		}
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach(function(value){
				value.should.have.property("Group")
			})
			dataA = data
			userGroupGet1Test()
		})

		let getParameter1: UserGroupGetParameter = {
			limit: 100,
			skip: 10,
			sortby: "username",
			order: "asc"
		} 
		let userGroupGet1 = new AppGET(devurl, userPath, port)
		userGroupGet1.setSessionToken(sessionToken)
		function userGroupGet1Test(){
			userGroupGet1.GET(getParameter1, (data: any, statusCode: number) => {
				statusCode.should.equal(200)
				data.forEach(function(value){
					value.should.have.property("Group")
				})
				
				console.log("limit check")
				data.length.should.equal(100)

				console.log("skip check")
				expect(data).to.eql(dataA.slice(-100))

				console.log("sortby and order check")
				sortCommonCheck(data, "asc", "username")
				done();
			})
		}
	})

	it("use inexistent username & should return []", (done) => {
		let getParameter: UserGroupGetParameter = {
			username: ["inexistent"]
		}
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.length.should.equal(0)
			done();
		})
	})

	it("use right and inexistent username & should return right username data", (done) => {
		let getParameter: UserGroupGetParameter = {
			username: ["testUser", "inexistent"]
		}
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach(function(val, i){
				val.should.have.property("Group")
				val.User.should.equal("testUser")
			})
			done();
		})
	})

	it("use feature wrong parameter & should return status code as 403", (done) => {

		function paramCheck(getParameter: any, paramError: string, param){
			return new Promise(function(resolve, reject){
				let userGroupGet = new AppGET(devurl, userPath, port)
				userGroupGet.setSessionToken(sessionToken)
				userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
					statusCode.should.equal(403)
					data.should.equal(paramError)
					resolve()
				})
			})
		}

		console.log("check limit")
		let wrong_limit: UserGroupGetParameter = {
			limit: [1]
		}
		let promise1 = paramCheck(wrong_limit, "error, invalid param in limit", "limit")

		console.log("check skip")
		let wrong_skip: UserGroupGetParameter = {
			skip: [1]
		}
		let promise2 = paramCheck(wrong_skip, "error, invalid param in skip", "skip")

		console.log("check username")
		let wrong_username: UserGroupGetParameter = {
			username: "tese"
		}
		let promise3 = paramCheck(wrong_username, "error, invalid param in username", "username")

		console.log("check sortby")
		let wrong_sortby: UserGroupGetParameter = {
			sortby: ["username"]
		}
		let promise4 = paramCheck(wrong_sortby, "error, invalid param in sortby", "sortby")

		console.log("check order")
		let wrong_order: UserGroupGetParameter = {
			order: ["asc"]
		}
		let promise5 = paramCheck(wrong_order, "error, invalid param in order", "order")


		Promise.all([promise1, promise2, promise3, promise4, promise5]).then(function(value){
			done()
		}).catch(function(){
			done()
		})
	})

	it("use wrong sessionToken & should return status code as 401", (done) => {
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken("wrong sessionToken")
		userGroupGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	

	it("group admin that username is test_group & should return users in this group", (done) => {
		let sessionToken = require('../config').sessionToken.test_group
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(200)			
			data.forEach((value, i) => {
				value.should.have.property("Group")
				value.User.should.satisfy((username) => {
					if(username == "test_group" || username == "test" || username == "test_1") {
							return true;	
						}else {
							return false;
					}
				})
			})
			done();
		})
	})	

	it("group admin query group member & should return member infomation", (done) => {
		let getParameter: UserGroupGetParameter = {
			username: ["testUser"]
		}
		let sessionToken = require('../config').sessionToken.test_group
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach((value, i) => {
				value.User.should.equal("testUser")
			})
			done();
		})
	})

	it("group admin query user not in this group & should return []", (done) => {
		let getParameter: UserGroupGetParameter = {
			username: ["admin"]
		}
		let sessionToken = require('../config').sessionToken.test_group
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.length.should.equal(0)
			done();
		})
	})
	

	it("normal admin that username is test & should return user test", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let userGroupGet = new AppGET(devurl, userPath, port)
		userGroupGet.setSessionToken(sessionToken)
		userGroupGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(200)			
			data.forEach((value, i) => {
				value.should.have.property("Group")
				value.User.should.equal("test")
			})
			done();
		})
	})

})

describe('Post /v1/user/group', () => {
	let sessionToken = require('../config').sessionToken.test_super
	let sessionToken1
	let userData: any = {}

	beforeEach((done) => {
		let putUser: AV.Object = new _User()
		putUser.set('username', "testUser")
		putUser.set('password', "testUser")
		putUser.save(null, {useMasterKey: true}).then((objects) => {
			userData.objectId = objects.id
			let acl = new AV.ACL()
			let administratorRole = new AV.Role('super_admin')
			acl.setRoleReadAccess(administratorRole, true)
			acl.setRoleWriteAccess(administratorRole, false)

			let group_admin_test_groupRole = new AV.Role('group_admin_5afe32a39f54543b319f0459')
			acl.setRoleReadAccess(group_admin_test_groupRole, true)
			acl.setRoleWriteAccess(group_admin_test_groupRole, false)

			acl.setReadAccess(objects.id, true)
			acl.setWriteAccess(objects.id, true);

			objects.setACL(acl)
			objects.save(null, {useMasterKey: true}).then((objects) => {
				console.log("create user for update ok")
				done()
			})
		}, (error) => {
			console.error("create user for update ok error", error)
			done()
		})
	})

	beforeEach((done) => {
		let login = new AppLogin(devurl, "/v1/login", port)
		let loginParams = {
			username: "testUser",
			password: "testUser"
		}
		login.login(loginParams,
			(data: any, statusCode: number) => {
				sessionToken1 = data.sessionToken
				done()
			})
	})

	afterEach((done) => {
		let deleteUser = AV.Object.createWithoutData('_User', userData.objectId);
		deleteUser.destroy({useMasterKey: true}).then(function (success) {
		// delete success
			console.log("delete fake data success")
			done()
		}, function (error) {
		// delete fail
			console.error("delete fake data error", error)
			done()
		})
	})




	it("config role and group to user 'test' & should return 201", (done) => {
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, relate user to group successfully")
				done()
			})
	})

	it("miss username and groups & should return 403", (done) => {
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST([{}],
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid username")
				done()
			})
	})

	it("miss groups & should return 403", (done) => {
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser"
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid groups")
				done()
			})
	})

	it("invalid username & should return 404", (done) => {
		let newUser: Array<UserGroupPostParameter> = [{
			username: "invalid",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal("user not found or no authority")
				done()
			})
	})

	it("invalid role & should return 401", (done) => {
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser",
			groups: [{
				role: "invalid",
				group: "test_group"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("there is a server error")
				done()
			})
	})

	it("invalid group & should return 404", (done) => {
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "invalid"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal("group not found or no authority")
				done()
			})
	})


	it("wrong sessionToken& should return 401", (done) => {
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken("wrong sessionToken")
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken")
				done()
			})
	})

	it("group admin add groups & should return 201", (done) => {
		sessionToken = require('../config').sessionToken.test_group
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, relate user to group successfully")
				done()
			})
	})

	it("normal admin add groups & should return 401", (done) => {
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken1)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("user do not have role")
				done()
			})
	})

	it("other normal admin add groups to user 'test' & should return 401", (done) => {
		sessionToken = require('../config').sessionToken.test_guest
		let newUser: Array<UserGroupPostParameter> = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userGroupPost = new AppPOST(devurl, userPath, port)
		userGroupPost.setSessionToken(sessionToken)
		userGroupPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("no authority")
				done()
			})
	})


})

describe('Put /v1/user/group', () => {
	let sessionToken = require('../config').sessionToken.test_super
	let userData: any = {}
	let newUser: Array<UserGroupPutParameter>

	let sessionToken1

	before((done) => {
		let putUser: AV.Object = new _User()
		putUser.set('username', "testUser")
		putUser.set('password', "testUser")
		putUser.save(null, {useMasterKey: true}).then((objects) => {
			userData.objectId = objects.id
			let acl = new AV.ACL()
			let administratorRole = new AV.Role('super_admin')
			acl.setRoleReadAccess(administratorRole, true)
			acl.setRoleWriteAccess(administratorRole, false)

			let group_admin_test_groupRole = new AV.Role('group_admin_5afe32a39f54543b319f0459')
			acl.setRoleReadAccess(group_admin_test_groupRole, true)
			acl.setRoleWriteAccess(group_admin_test_groupRole, false)

			acl.setReadAccess(objects.id, true)
			acl.setWriteAccess(objects.id, true);

			objects.setACL(acl)
			objects.save(null, {useMasterKey: true}).then((objects) => {
				console.log("create user for update ok")
				done()
			})
		}, (error) => {
			console.error("create user for update ok error", error)
			done()
		})
	})

	before((done) => {
		let login = new AppLogin(devurl, "/v1/login", port)
		let loginParams = {
			username: "testUser",
			password: "testUser"
		}
		login.login(loginParams,
			(data: any, statusCode: number) => {
				sessionToken1 = data.sessionToken
				done()
			})
	})

	after((done) => {
		let deleteUser = AV.Object.createWithoutData('_User', userData.objectId);
		deleteUser.destroy({useMasterKey: true}).then(function (success) {
		// delete success
			console.log("delete fake data success")
			done()
		}, function (error) {
		// delete fail
			console.error("delete fake data error", error)
			done()
		})
	})


	it("update groups to user 'testUser' & should return 201", (done) => {
		newUser = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, update user relate to group successfully")
				done()
			})
	})

	it("miss username and groups & should return 403", (done) => {
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT([{}],
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid username")
				done()
			})
	})

	it("miss groups & should return 403 & should return 403", (done) => {
		newUser = [{
			username: "testUser"
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid groups")
				done()
			})
	})

	it("invalid username & should return 404", (done) => {
		newUser = [{
			username: "invalid",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal("user not found or no authority")
				done()
			})
	})

	it("invalid role & should return 401", (done) => {
		newUser= [{
			username: "testUser",
			groups: [{
				role: "invalid",
				group: "test_group"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("there is a server error")
				done()
			})
	})

	it("invalid group & should return 404", (done) => {
		newUser= [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "invalid"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal("group not found or no authority")
				done()
			})
	})


	it("wrong sessionToken& should return 401", (done) => {
		newUser = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken("wrong sessionToken")
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken")
				done()
			})
	})

	it("group admin update groups & should return 201", (done) => {
		sessionToken = require('../config').sessionToken.test_group
		newUser = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, update user relate to group successfully")
				done()
			})
	})

	it("normal admin update groups & should return 401", (done) => {
		newUser = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken1)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("no authority")
				done()
			})
	})

	it("other normal admin update groups to user 'test' & should return 401", (done) => {
		sessionToken = require('../config').sessionToken.test_guest
		newUser = [{
			username: "testUser",
			groups: [{
				role: "admin",
				group: "test_group"
			}]
		}]
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("no authority")
				done()
			})
	})



})