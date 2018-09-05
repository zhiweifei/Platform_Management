import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppLogin, AppPUT,AppPOST} from "../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../lib/sort"
import querystring = require('querystring');
import * as AV from 'leancloud-storage';
import { UserPasswordPutParameter} from "./lib/parameter"
const appkey = require('../config').AppKey
const masterKey = require('../config').MasterKey
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const userPath = "/v1/user/password"
const loginPath = "/v1/login"
const devurl = "protocol-access-test.leanapp.cn";
const port = 80;
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
		let newUser = {
			username: userData.username,
			password: userData.password
		}
		let userPost = new AppPOST(devurl, '/v1/user', port)
		userPost.POST(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, build up new User successfully")
				console.log("fake post user success")
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




	it("testcase1# user self modify password & should return 201", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			oldPassword: userData.password,
			newPassword: "newPassword"
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				console.log('Put /v1/user/password testcase1# data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, update user password successfully")
				userData.password = "newPassword"
				done()
			})
	})

	it("testcase2# modify password with miss username & should return 403", (done) => {
		let params: UserPasswordPutParameter = {
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				console.log('Put /v1/user/password testcase2# data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal("error, miss username")
				done()
			})
	})


	it("testcase3# modify password with miss oldPassword & should return 403", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			newPassword: "newPassword"
		};
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				console.log('Put /v1/user/password testcase3# data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal("error, miss oldPassword")
				done()
			})
	})

	it("testcase4# modify password with miss newPassword & should return 403", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			oldPassword: userData.password
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				console.log('Put /v1/user/password testcase4# data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal("error, miss newPassword")
				done()
			})
	})


	it("testcase5# modify password with wrong oldPassword & should return 401", (done) => {
		let params: UserPasswordPutParameter = {
			username: userData.username,
			oldPassword: "wrong password",
			newPassword: "newPassword"
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken(sessionToken)
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				console.log('Put /v1/user/password testcase5# data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("The username and password mismatch")
				done()
			})
	})



	it("testcase6# modify password with wrong sessionToken& should return 401", (done) => {
		let params: UserPasswordPutParameter = {
			username: "testUser",
			oldPassword: "testUser",
			newPassword: "newPassword"
		}
		let userPasswordPut = new AppPUT(devurl, userPath, port)
		userPasswordPut.setSessionToken("wrong sessionToken")
		userPasswordPut.PUT(params,
			(data: any, statusCode: number) => {
				console.log('Put /v1/user/password testcase6# data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken")
				done()
			})
	})

	it("testcase7# other admin modify password & should return 401", (done) => {
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
				console.log('Put /v1/user/password testcase7# data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("no authority to update the user")
				done()
			})
	})



})