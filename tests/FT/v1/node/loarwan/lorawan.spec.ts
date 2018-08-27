import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import httpRequest from "../../../lib/http"
import {sortCommonCheck} from "../../../lib/sort"

const devurl = "protocol-access-test.leanapp.cn"
const path = "/v1/node/lorawan"
const port = 80

const config = require("../../config.json")

describe('Get /v1/node/lorawan', () => {

	it("default parameter should return 1000 data and statusCode 200", (done) => {
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.GET('', function(data, statusCode){	
			data.length.should.equal(1000)
			statusCode.should.equal(200)
			done()
		})
	})

	it("limit 10 should return 10 data and statusCode 200", (done) => {
		let parameter = {
			limit: 10
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.GET(parameter, function(data, statusCode){	
			data.length.should.equal(10)
			statusCode.should.equal(200)
			done()
		})
	})

	it("skip 10 should return data skip 10 data and statusCode 200", (done) => {
		console.log("get 20 data first")
		let parameter = {
			limit: 20
		}
		let Data: any
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.GET(parameter, function(data, statusCode){	
			data.length.should.equal(20)
			statusCode.should.equal(200)
			Data = data
			httpGet1()
		})

		let parameter1 = {
			limit: 10,
			skip: 10
		}
		let http1 = new httpRequest(devurl, port, path)
		http1.setHeaders({sessionToken: config.sessionToken.test_super})
		function httpGet1(){
			http1.GET(parameter1, function(data, statusCode){	
				data.length.should.equal(10)
				statusCode.should.equal(200)
				expect(data).to.deep.equal(Data.slice(10))
				done()
			})
		}
	})

	it("use sortby 'nodeId' or 'createTime' and order 'asc' or 'desc' should return data with relative sortby and statusCode 200", (done) => {
		function sortCheck(sortby: string, order: string) {
			return new Promise(function(resolve, reject){
				let parameter= {
					sortby: sortby,
					order: order
				}
				let http = new httpRequest(devurl, port, path)
				http.setHeaders({sessionToken: config.sessionToken.test_super})
				http.GET(parameter, (data: any, statusCode: number) => {
					statusCode.should.equal(200)
					sortCommonCheck(data, order, sortby)
					resolve()
				})	
			})	
		}

		console.log("sortby 'nodeId' and order 'asc'")
		let promise1 = sortCheck("nodeId", "asc")

		console.log("sortby 'nodeId' and order 'desc'")
		let promise2 = sortCheck("nodeId", "desc")

		console.log("sortby 'createTime' and order 'asc'")
		let promise3 = sortCheck("createTime", "asc")

		console.log("sortby 'createTime' and order 'desc'")
		let promise4 = sortCheck("createTime", "desc")

		Promise.all([promise1, promise2, promise3, promise4]).then(function(){
			done()
		}).catch(function(){
			done()
		})

	})

	it("invalid sessionToken should return message 'Invalid SessionToken' and statusCode 401", (done) => {
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: "wrong"})
		http.GET("", function(data, statusCode){	
			data.should.equal("Invalid SessionToken")
			statusCode.should.equal(401)
			done()
		})

	})


})