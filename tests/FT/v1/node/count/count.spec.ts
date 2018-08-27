import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import httpRequest from "../../../lib/http"

const devurl = "protocol-access-test.leanapp.cn"
const path = "/v1/node/count"
const port = 80

const config = require("../../config.json")

describe('Get /v1/node/count', function() {

	this.timeout(15000)

	it("valid sessionToken should return node count and statusCode 200", (done) => {
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test})
		http.GET('',function(data, statusCode){
			data.should.have.property("count")
			statusCode.should.equal(200)
			done()
		})
	})

	it("invalid sessionToken should return 'Invalid SessionToken' and statusCode 401", (done) => {
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: 'wrong'})
		http.GET('',function(data, statusCode){
			data.should.equal("Invalid SessionToken")
			statusCode.should.equal(401)
			done()
		})
	})
})