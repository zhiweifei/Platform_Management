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

describe('Put /v1/user/verify', () => {
	let sessionToken = require('../config').sessionToken.test
	let userData: any = {
		email: "testcase@qq.com",
		phone : 13423455555
	}

	it("verify email & should return 201", (done) => {
		let params: UserVerifyParameter = {
			email: userData.email
		}
		let userVerifyPost = new AppPOST(devurl, userPath, port)
		userVerifyPost.setSessionToken(sessionToken)
		userVerifyPost.POST(params,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, verify email or phone success")
				done()
			})
	})

	it.skip("verify phone & should return 201", (done) => {
		let params: UserVerifyParameter = {
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
			email: "InvalidEmail"
		}
		let userVerifyPost = new AppPOST(devurl, userPath, port)
		userVerifyPost.setSessionToken(sessionToken)
		userVerifyPost.POST(params,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(205)
				data.should.equal("An user with the specified email was not found. ")
				done()
			})
	})


	it.skip("Invalid phone & should return 403", (done) => {
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
				data.should.equal("miss email")
				done()
			})
	})


})