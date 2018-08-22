import 'chai/register-should'
import 'mocha'
import { AppGET} from "../../../lib/http-tools"

const groupPath = "/v1/group/count";
const devurl = "protocol-access-test.leanapp.cn";
const port = 80;

describe('Get /v1/group/count', () => {
	let sessionToken = require('../../config').sessionToken.test_super;

	it(" should return 200 and count", (done) => {
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) =>{
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done()
		})
	})


	it("use wrong sessionToken & should return status code as 400", (done) => {
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken + "wrong")
		groupGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	it("group admin that username is test_group & should return group:test_group ", (done) => {
		let sessionToken = require('../../config').sessionToken.test_group
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.be.a("number")
			done();
		})
	})

	it("normal admin that username is test & should return {count:1}", (done) => {
		let sessionToken = require('../../config').sessionToken.test
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(200)
			data.should.have.property("count")
			data.count.should.equal(1)
			done();
		})
	})

})
