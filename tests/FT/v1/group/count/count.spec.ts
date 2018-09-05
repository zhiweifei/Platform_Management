import 'chai/register-should'
import 'mocha'
import { AppGET} from "../../../lib/http-tools"

const groupPath = "/v1/group/count";
const devurl = "protocol-access-test.leanapp.cn";
const port = 80;

describe('Get /v1/group/count', () => {
	let sessionToken = require('../../config').sessionToken.test_super;

	it(" testcase1# should return 200 and count", (done) => {
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) =>{
			console.log('Get /v1/group/count testcase1# data',data);
			console.log('Get /v1/group/count testcase1# data',statusCode);
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done()
		})
	})


	it("testcase2# use wrong sessionToken & should return status code as 401", (done) => {
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken + "wrong")
		groupGet.GET("",(data: any, statusCode: number) => {
			console.log('Get /v1/group/count testcase2# data',data);
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	it("testcase3# group admin that username is test_group & should return group:test_group ", (done) => {
		let sessionToken = require('../../config').sessionToken.test_group
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) => {
			console.log('Get /v1/group/count testcase3# data',data);
			console.log('Get /v1/group/count testcase3# data',statusCode);
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done();
		})
	})

	it("testcase4# normal admin that username is test & should return {count:1}", (done) => {
		let sessionToken = require('../../config').sessionToken.test
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) => {
			console.log('Get /v1/group/count testcase4# data',data);
			console.log('Get /v1/group/count testcase4# data',statusCode);
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.equal(1)
			done();
		})
	})

})
