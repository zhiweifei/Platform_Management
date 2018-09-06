import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppPUT, AppGET, AppPOST, AppDELETE } from "../../../lib/http-tools"
import { UserGetParameter } from "../lib/parameter"

const userPath = "/v1/user/count"

const devurl = "protocol-access-test.leanapp.cn";
const port = 80;

describe('Get /v1/user/count', () => {
	let sessionToken = require('../../config').sessionToken.test_super

	it("testcase1# should return 200 and count", (done) => {
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET("", (data: any, statusCode: number) => {
			console.log('Get /v1/user/count testcase1# data statusCode',data,statusCode);
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done()
		})
	})

	it("testcase2# use wrong sessionToken & should return status code as 401", (done) => {
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken("wrong sessionToken")
		userGet.GET("", (data: any, statusCode: number) => {
			console.log('Get /v1/user/count testcase2# data statusCode',data,statusCode);
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	it("testcase3# group admin that username is test_group & should return 200 and count", (done) => {
		let sessionToken = require('../../config').sessionToken.test_group
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET("",(data: any, statusCode: number) => {
			console.log('Get /v1/user/count testcase3# data statusCode',data,statusCode);
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done();
		})
	})

	it("testcase4# normal admin that username is test & should return 200 and count", (done) => {
		let sessionToken = require('../../config').sessionToken.test
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET("",(data: any, statusCode: number) => {
			console.log('Get /v1/user/count testcase4# data statusCode',data,statusCode);
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done();
		})
	})

})