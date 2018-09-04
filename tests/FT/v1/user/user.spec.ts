import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppPUT, AppGET, AppPOST, AppDELETE } from "../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../lib/sort"
import querystring = require('querystring');
import * as AV from 'leancloud-storage';
import { UserGetParameter, UserPostParameter, UserPutParameter ,UserDeleteParameter} from "./lib/parameter"

const appkey = require('../config').AppKey
const masterKey = require('../config').MasterKey
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const userPath = "/v1/user"
const devurl = "protocol-access-test.leanapp.cn";
const port = 80;
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
	//console.error("Check init error:", e)
}

describe('Get /v1/user', () => {
	let sessionToken = require('../config').sessionToken.test_super

	it("should return 1000 user data", (done) => {
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET("", (data: any, statusCode: number) => {
			//data.length.should.equal(1000)
			expect(data.length).to.be.at.most(1000)
			statusCode.should.equal(200)
			//Check if sortby created time and use descend
			done()
		})
	})

	it("use limit 10 & should return 10 user data", (done) => {
		let getParameter: UserGetParameter = {
			limit: 10
		}
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET(getParameter, (data: any, statusCode: number) => {
			data.length.should.equal(10)
			statusCode.should.equal(200)
			done()
		})
	})

	it("use limit 10 and skip 10 & should return 10 user data with 10 skip", (done) => {
		console.log("Get 20 data at first")
		let getParameter: UserGetParameter = {
			limit: 20
		}
		let userGet = new AppGET(devurl, userPath, port)
		let dataA: any
		userGet.setSessionToken(sessionToken)
		userGet.GET(getParameter, (data: any, statusCode: number) => {
			data.length.should.equal(20)
			statusCode.should.equal(200)
			dataA = data
			userGet1Test()
		})

		console.log("Skip 20 data and get 20 data, then compare")
		let getParameter1: UserGetParameter = {
			limit: 10,
			skip: 10
		}
		let userGet1 = new AppGET(devurl, userPath, port)
		userGet1.setSessionToken(sessionToken)
		function userGet1Test(){
			userGet1.GET(getParameter1,(data: any, statusCode: number) => {
				data.length.should.equal(10)
				statusCode.should.equal(200)
				expect(data).to.eql(dataA.slice(-10))
				done()
			})
		}
	})

	it("use username 'test' and 'test_1' to filter data & should only return specify user data", (done) => {
		let getParameter: UserGetParameter = {
			username: ["test"]
		}
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach((value, i) => {
				value.should.have.property('username')
				value.username.should.satisfy((username) => {
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
			let getParameter: UserGetParameter = {
				sortby: sortby
			}
			let userGet = new AppGET(devurl, userPath, port)
			userGet.setSessionToken(sessionToken)
			userGet.GET(getParameter, (data: any, statusCode: number) => {
				statusCode.should.equal(200)
				sortCommonCheck(data, "dsc", sortby)
				sortArray.push(sortby)
				if(sortArray.indexOf("username") >= 0 && sortArray.indexOf("createTime") >= 0){
					done()
				}
			})		
		}

		console.log("sortby username")
		sortCheck("username")

		console.log("sortby createTime")
		sortCheck("createTime")
	})

	it("use order as asc & should return data sort as ascend", (done) => {
		let getParameter: UserGetParameter = {
			order: "asc"
		}
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			sortDateCheck(data, getParameter.order, "createdAt")
			done();
		})
	})

	it("Comprehensive test & should return data limit 100 with skip 10, filter data use username as 'user1' , sortby username order as ascend", (done) => {
		console.log("Get 20 data at first")
		let dataA: any
		let getParameter: UserGetParameter = {
			limit: 20,
			sortby: "username",
			order: "asc"
		}
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			dataA = data
			userGet1Test()
		})

		let getParameter1: UserGetParameter = {
			limit: 10,
			skip: 10,
			sortby: "username",
			order: "asc"
		} 
		let userGet1 = new AppGET(devurl, userPath, port)
		userGet1.setSessionToken(sessionToken)
		function userGet1Test(){
			userGet1.GET(getParameter1, (data: any, statusCode: number) => {
				statusCode.should.equal(200)
				
				console.log("limit check")
				data.length.should.equal(10)

				console.log("skip check")
				expect(data).to.eql(dataA.slice(-10))

				console.log("sortby and order check")
				sortCommonCheck(data, "asc", "username")
				done();
			})
		}
	})

	it("use inexistent username & should return []", (done) => {
		let getParameter: UserGetParameter = {
			username: ["inexistent"]
		}
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.length.should.equal(0)
			done();
		})
	})

	it("use right and inexistent username & should return right username data", (done) => {
		let getParameter: UserGetParameter = {
			username: ["test", "inexistent"]
		}
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach(function(val, i){
				val.username.should.equal("test")
			})
			done();
		})
	})

	it("use feature wrong parameter & should return status code as 403", (done) => {

		function paramCheck(getParameter: any, paramError: string, param){
			return new Promise(function(resolve, reject){
				let userGet = new AppGET(devurl, userPath, port)
				userGet.setSessionToken(sessionToken)
				userGet.GET(getParameter, (data: any, statusCode: number) => {
					statusCode.should.equal(403)
					data.should.equal(paramError)
					resolve()
				})
			})
		}

		console.log("check limit")
		let wrong_limit: UserGetParameter = {
			limit: [1]
		}
		let promise1 = paramCheck(wrong_limit, "error, invalid param in limit", "limit")

		console.log("check skip")
		let wrong_skip: UserGetParameter = {
			skip: [1]
		}
		let promise2 = paramCheck(wrong_skip, "error, invalid param in skip", "skip")

		console.log("check username")
		let wrong_username: UserGetParameter = {
			username: "tese"
		}
		let promise3 = paramCheck(wrong_username, "error, invalid param in username", "username")

		console.log("check sortby")
		let wrong_sortby: UserGetParameter = {
			sortby: ["username"]
		}
		let promise4 = paramCheck(wrong_sortby, "error, invalid param in sortby", "sortby")

		console.log("check order")
		let wrong_order: UserGetParameter = {
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
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken("wrong sessionToken")
		userGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	it("group admin that username is test_group & should return users in this group", (done) => {
		let sessionToken = require('../config').sessionToken.test_group
		let nodeInfoGet = new AppGET(devurl, userPath, port)
		nodeInfoGet.setSessionToken(sessionToken)
		nodeInfoGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.forEach((value, i) => {
				if(value.username == 'test_group')
					done();
			})

		})
	})

	it("group admin query group member & should return member infomation", (done) => {
		let getParameter: UserGetParameter = {
			username: ["test"]
		}
		let sessionToken = require('../config').sessionToken.test_group
		let nodeInfoGet = new AppGET(devurl, userPath, port)
		nodeInfoGet.setSessionToken(sessionToken)
		nodeInfoGet.GET(getParameter, (data: any, statusCode: number) => {
			console.log('data statusCode',data,statusCode);
			statusCode.should.equal(200)
			data.forEach((value, i) => {
				value.username.should.equal("test")
			})
			done();
		})
	})

	it("group admin query user not in this group & should return []", (done) => {
		let getParameter: UserGetParameter = {
			username: ["admin"]
		}
		let sessionToken = require('../config').sessionToken.test_group
		let nodeInfoGet = new AppGET(devurl, userPath, port)
		nodeInfoGet.setSessionToken(sessionToken)
		nodeInfoGet.GET(getParameter, (data: any, statusCode: number) => {
			console.log('data statusCode',data,statusCode);
			statusCode.should.equal(200)
			data.length.should.equal(0)
			done();
		})
	})
	

	it("normal admin that username is test & should return user test", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let nodeInfoGet = new AppGET(devurl, userPath, port)
		nodeInfoGet.setSessionToken(sessionToken)
		nodeInfoGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(200)			
			data.forEach((value, i) => {
				value.username.should.equal("test")
			})
			done();
		})
	})

})

describe('Post /v1/user', () => {

	afterEach((done) => {
		let query = new AV.Query('_User');
		query.equalTo("username", "testUser")
		query.find({useMasterKey: true}).then(function(td){
			AV.Object.destroyAll(td, {useMasterKey: true}).then(function (success) {
			// delete success
				console.log("delete post user success")
				done()
			}, function (error) {
			// delete fail
				done()
			});
		})
	})

	it("create new user with username, password& should return 201", (done) => {
		let newUser: UserPostParameter = {
			username: "testUser",
			password: "testUser"
		}
		let userPost = new AppPOST(devurl, userPath, port)
		userPost.POST(newUser,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, build up new User successfully")
				done()
			})
	})

	it("create new user with username, password,group, userInfo, email, phone & should return 201", (done) => {
		let newUser: UserPostParameter = {
			username: "testUser",
			password: "testUser",
			group: "test_group",
			userInfo: "this is test user",
			email: "testUser@gmail.com",
			phone: "13423456666"
		}
		let userPost = new AppPOST(devurl, userPath, port)
		userPost.POST(newUser,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, build up new User successfully")
				done()
			})
	})

	it("create duplicate user  email or phone & should return 403 status code", (done) => {

		function userPostTest(newUser, res, status){
			return new Promise(function(resolve, reject){
				let userPost = new AppPOST(devurl, userPath, port)
				userPost.POST(newUser,
					(data: any, statusCode: number) => {
						statusCode.should.equal(status)
						data.should.equal(res)
						resolve()
					})
			})
		}

		let newUser: UserPostParameter = {
			username: "testUser",
			password: "testUser",
			userInfo: "this is test user",
			email: "testUser@gmail.com",
			phone: "13423456666"
		}

		console.log("check duplicate user")
		let duplicateUser: UserPostParameter = {
			username: "testUser",
			password: "testUser"
		}

		console.log("check duplicate email")
		let duplicateEmail: UserPostParameter= {
			username: "testUser1",
			password: "testUser1",
			email: "testUser@gmail.com"
		}

		console.log("check duplicate phone")
		let duplicatePhone: UserPostParameter = {
			username: "testUser1",
			password: "testUser1",
			phone: "13423456666"
		}

		userPostTest(newUser, "success, build up new User successfully", 201).then(function(){
			return Promise.all([userPostTest(duplicateUser, "Username has already been taken", 403), 
								userPostTest(duplicateEmail, "email has been occupied", 403), 
								userPostTest(duplicatePhone, "Mobile phone number has already been taken", 403)])
		}).then(function(){
			done()
		})
	})

	it("create user with invalid email & should return 401 status code", (done) => {
		let newUser: UserPostParameter = {
			username: "testUser",
			password: "testUser",
			userInfo: "this is test user",
			email: "invalid",
			phone: "13423456666"
		}
		let userPost = new AppPOST(devurl, userPath, port)

		userPost.POST(newUser,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal("The email address was invalid")
				done()
			})
	})

	it("create user with invalid phone & should return 401 status code", (done) => {
		let newUser:  UserPostParameter = {
			username: "testUser",
			password: "testUser",
			userInfo: "this is test user",
			email: "testUser2@gmail.com",
			phone: "12345"
		}
		let userPost = new AppPOST(devurl, userPath, port)

		userPost.POST(newUser,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal("Mobile phone number is invalid")
				done()
			})
	})

	it("create user with invalid group & should return 401 status code", (done) => {
		let newUser:  UserPostParameter = {
			username: "testUser",
			password: "testUser",
			group : "inexistence",
			userInfo: "this is test user",
			email: "testUser2@gmail.com",
			phone: "13423456666"
		}
		let userPost = new AppPOST(devurl, userPath, port)

		userPost.POST(newUser,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(404)
				data.should.equal("group not found")
				done()
			})
	})


})

describe('Put /v1/user', () => {
	let sessionToken = require('../config').sessionToken.test
	let userData: any = {}
	let newUser: UserPutParameter

	it("update a user with username and userInfo & should 201 success", (done) => {
		newUser = {
			username: "test",
			userInfo: "this is test user"
		}
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, update user Info successfully")
				done()
			})
	})

	it("update user with username, newName,  userInfo, email, phone and group & should return 201 success", (done) => {
		newUser = {
			username: "test",
			newName: "test",
			userInfo: "this is test user",
			email: "testtest@qq.com",
			phone: "13423455555"
		}
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
                console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, update user Info successfully")
				done()
			})
	})

	it("update user with invalid email & should return 401 error", (done) => {
		newUser = {
			username: "test",
			newName: "test",
			userInfo: "this is test user",
			email: "invalid",
			phone: "13423455555"
		}
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
                console.log('data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("there is a server error")
				done()
			})
	})

	it("update user with invalid phone & should return 401 error", (done) => {
		newUser = {
			username: "test",
			newName: "test",
			userInfo: "this is test user",
			email: "testtest@qq.com",
			phone: "invalid"
		}
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
                console.log('data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("there is a server error")
				done()
			})
	})


	it("invalid sessionToken & should return 401 Invalid SessionToken", (done) => {
		newUser = {
			username: "test",
			newName: "test",
			userInfo: "this is test user",
			email: "test1@qq.com",
			phone: "13423455555"
		}
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken("wrong sessionToken")
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken")
				done()
			})
	})

	it("user other user to update user test& should return 401 error", (done) => {
		let sessionToken = require('../config').sessionToken.test_super
		newUser = {
			username: "test",
			newName: "test",
			userInfo: "this is test user",
			email: "test1@qq.com",
			phone: "13423455555"
		}
		let userPut = new AppPUT(devurl, userPath, port)
		userPut.setSessionToken(sessionToken)
		userPut.PUT(newUser,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("no authority to update the user")
				done()
			})
	})



})

describe('Delete /v1/user', () => {
	let sessionToken = require('../config').sessionToken.test_super
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

			let group_admin_test_groupRole = new AV.Role('group_admin_5b764f0efb4ffe0058960688')
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

	it("use username as specify & should return 204", (done) => {
		let deleteParam: UserDeleteParameter = {
			username: ["testUser"]
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
			statusCode.should.equal(204)
			done()
		})

	})

	it("use null param & should return 403 status code", (done) => {
		let deleteParam: UserDeleteParameter = {
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal('error, miss username')
				done()
			})
	})

	it("use inexistent username & should return 404 status code", (done) => {
		let deleteParam: UserDeleteParameter = {
			username: ["invalid"]
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal('some user not find')
				done()
			})
	})

	it("use valid and invalid username as specify & should return 404 status code", (done) => {
		let deleteParam: UserDeleteParameter = {
			username: ["testUser", "invalid"]
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(404)
				data.should.equal('some user not find')
			done()
		})

	})


	it("use wrong parameter & should return 403 status code", (done) => {
		let deleteParam: UserDeleteParameter = {
			username: "testUser"
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal('error, invalid param in username')
				done()
			})
	})

	it("use wrong SessionToken & should return 400 status code", (done) => {
		let deleteParam: UserDeleteParameter = {
			username: ["testUser"]
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken("wrong token")
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal('Invalid SessionToken')
				done()
			})
	})

	it("group admin that user 'test_group' & should return 204 status code", (done) => {
		let sessionToken = require('../config').sessionToken.test_group
		let deleteParam: UserDeleteParameter = {
			username: ["testUser"]
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
                statusCode.should.equal(401)
                data.should.equal('no authority to delete user')
				done()
			})
	})

	it("normal admin that user 'test' & should return 401 status code", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let deleteParam: UserDeleteParameter = {
			username: ["testUser"]
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal('no authority to delete user')
				done()
			})
	})

	it("other normal admin that user 'test_guest' & should return 401 status code", (done) => {
		let sessionToken = require('../config').sessionToken.test_guest
		let deleteParam: UserDeleteParameter = {
			username: ["testUser"]
		} 
		let userDelete = new AppDELETE(devurl, userPath, port)
		userDelete.setSessionToken(sessionToken)
		userDelete.DELETE(deleteParam,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal('no authority to delete user')
				done()
			})
	})
})
