import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppLogin, AppPOST} from "../../lib/http-tools"
import querystring = require('querystring');
import * as AV from 'leancloud-storage';
import { UserVerifyParameter} from "./lib/parameter"
//const devurl = "localhost"
const appkey = require('../config').AppKey
const masterKey = require('../config').MasterKey
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const userPath = "/v1/user/verify"
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
	console.error("Check init error:", e)
}


describe('Put /v1/user/verify', () => {
	let sessionToken = require('../config').sessionToken.test
	let userData: any = {
		username: "test",
		email: "test@qq.com",
		phone : 13423455555
	}

	it("verify email & should return 201", (done) => {
		let params: UserVerifyParameter = {
			username: userData.username,
			email: userData.email
		}
		let userVerifyPost = new AppPOST(devurl, userPath, port)
		userVerifyPost.setSessionToken(sessionToken)
		userVerifyPost.POST(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, verify email or phone success")
				done()
			})
	})

	it("verify phone & should return 201", (done) => {
		let params: UserVerifyParameter = {
			username: userData.username,
			phone: userData.phone
		}
		let userVerifyPost = new AppPOST(devurl, userPath, port)
		userVerifyPost.setSessionToken(sessionToken)
		userVerifyPost.POST(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, verify email or phone success")
				done()
			})
	})


	it("Invalid email & should return 403", (done) => {
		let params: UserVerifyParameter = {
			username: userData.username,
			email: "wrong"
		}
		let userVerifyPost = new AppPOST(devurl, userPath, port)
		userVerifyPost.setSessionToken(sessionToken)
		userVerifyPost.POST(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid username")
				done()
			})
	})


	it("Invalid phone & should return 403", (done) => {
		let params: UserVerifyParameter = {
			username: userData.username,
			phone: 1245464
		};
		let userVerifyPost = new AppPOST(devurl, userPath, port)
		userVerifyPost.setSessionToken(sessionToken)
		userVerifyPost.POST(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid oldPassword")
				done()
			})
	})

	it("no params & should return 403", (done) => {
		let params: UserVerifyParameter = {
		}
		let userVerifyPost = new AppPOST(devurl, userPath, port)
		userVerifyPost.setSessionToken(sessionToken)
		userVerifyPost.POST(params,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid newPassword")
				done()
			})
	})


})