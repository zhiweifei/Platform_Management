import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppLogin, AppPUT} from "../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../lib/sort"
import querystring = require('querystring');
import * as AV from 'leancloud-storage';
import { UserPasswordPutParameter} from "./lib/parameter"
//const devurl = "localhost"
const appkey = require('../config').AppKey
const masterKey = require('../config').MasterKey
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const userPath = "/v1/user/password"
const loginPath = "/v1/login"
//const port = parseInt(process.env.PORT || require("../config").port)
const devurl = "protocol-access.leanapp.cn";
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


describe('Put /v1/user/password', () => {
	let sessionToken:string
	let userData: any = {
		username: "testUser",
		password: "testUser"
	}

	beforeEach((done) => {
		let putUser: AV.Object = new _User()
		putUser.set('username', userData.username)
		putUser.set('password', userData.password)
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


	beforeEach((done) => {
		let login = new AppLogin(devurl, loginPath, port)
		let loginParams = {
			username: userData.username,
			password: userData.password
		}
		login.login(loginParams,
			(data: any, statusCode: number) => {
				sessionToken = data.sessionToken
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




	it("user self modify password & should return 201", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			oldPassword: userData.password,
			newPassword: "newPassword"
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, update user password successfully")
				userData.password = "newPassword"
				done()
			})
	})

	it("modify password with miss username & should return 403", (done) => {
		let params: UserPasswordPutParameter = {
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("error, miss username")
				done()
			})
	})


	it("modify password with miss oldPassword & should return 403", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			newPassword: "newPassword"
		};
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("error, miss oldPassword")
				done()
			})
	})

	it("modify password with miss newPassword & should return 403", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			oldPassword: userData.password
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("error, miss newPassword")
				done()
			})
	})


	it("modify password with wrong oldPassword & should return 401", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			oldPassword: "wrong password",
			newPassword: "newPassword"
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("The username and password mismatch")
				done()
			})
	})



	it("modify password with wrong sessionToken& should return 401", (done) => {
		let params: UserPasswordPutParameter = {
			username: "testUser",
			oldPassword: "testUser",
			newPassword: "newPassword"
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken("wrong sessionToken")
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken")
				done()
			})
	})

//todo problem
	it("other admin modify password & should return 401", (done) => {
		sessionToken = require('../config').sessionToken.test_guest
		let params: UserPasswordPutParameter = {
			username: userData.username,
			oldPassword: userData.password,
			newPassword: "newPassword"
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("no authority to update the user")
				done()
			})
	})



})