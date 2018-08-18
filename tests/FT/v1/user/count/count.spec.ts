import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppPUT, AppGET, AppPOST, AppDELETE } from "../../../lib/http-tools"
import { UserGetParameter } from "../lib/parameter"

const devurl = "localhost"
const userPath = "/v1/user/count"
const port = parseInt(process.env.PORT || require("../../config").port)

describe('Get /v1/user/count', () => {
	let sessionToken = require('../../config').sessionToken.test_super

	it("should return 200 and count", (done) => {
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
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

	it("group admin that username is test_group & should return 200 and count", (done) => {
		let sessionToken = require('../../config').sessionToken.test_group
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done();
		})
	})

	it("normal admin that username is test & should return 200 and count", (done) => {
		let sessionToken = require('../../config').sessionToken.test
		let userGet = new AppGET(devurl, userPath, port)
		userGet.setSessionToken(sessionToken)
		userGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done();
		})
	})

})