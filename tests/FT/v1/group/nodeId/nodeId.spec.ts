import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppGET } from "../../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../../lib/sort"
import querystring = require('querystring');
import { GroupQueryParameter} from "../lib/parameter"

let sessionToken = require('../../config').sessionToken.test_super
const groupNamePath = "/v1/group/nodeId"

const devurl = "protocol-access-test.leanapp.cn";
const port = 80;


describe('Get /v1/group/nodeId', () => {

	it("default parameter should return less than 1000 group data ", (done) => {
		let groupQuery: GroupQueryParameter = {
			name: 'test_group'
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) =>{
			//data.length.should.equal(1000)
			expect(data.length).to.be.at.most(1000)
			statusCode.should.equal(200)
			done()
		})
	})

	it("without must name param should return error, miss group name", (done) => {
		let groupQuery: GroupQueryParameter = {
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) =>{
			//data.length.should.equal(1000)
			statusCode.should.equal(403)
			data.should.equal('error, miss group name')
			done()
		})
	})

	it("use limit 20 &  should return 20 group relate user data", (done) => {
		let groupQuery: GroupQueryParameter = {
			name: 'test_group',
			limit: 20
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) =>{
			expect(data.length).to.be.at.most(20)
			statusCode.should.equal(200)
			done()
		})
	})

	it("use limit 10 and skip 10 &  should return 10 group data with 10 skip", (done) => {
		console.log("Get 20 data at first")
		let groupQuery: GroupQueryParameter = {
			name : "test_group",
			limit: 20
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		let dataA: any
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) =>{
			data.length.should.equal(20)
			statusCode.should.equal(200)
			dataA = data
			groupNameGet1.GET(groupQuery1, (data: any, statusCode: number) =>{
				data.length.should.equal(10)
				statusCode.should.equal(200)
				expect(data).to.eql(dataA.slice(-10))
				done()
			})
		})

		console.log("Skip 20 data and get 20 data, then compare")
		let groupQuery1: GroupQueryParameter = {
			name : "test_group",
			limit: 10,
			skip: 10
		}
		let groupNameGet1 = new AppGET(devurl, groupNamePath, port)
		groupNameGet1.setSessionToken(sessionToken)
	})

	it("Comprehensive test & should return data limit 10 with skip 10", (done) => {
		console.log("Get 20 data at first")
		let dataA: any
		let groupQuery: GroupQueryParameter = {
			name : "test_group",
			limit: 20,
			sortby: "name",
			order: "asc"
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			dataA = data
			groupGet1Test()
		})


		let groupQuery1: GroupQueryParameter = {
			name : "test_group",
			limit: 10,
			skip: 10,
			sortby: "name",
			order: "asc"
		}
		let groupNameGet1 = new AppGET(devurl, groupNamePath, port)
		groupNameGet1.setSessionToken(sessionToken)
		function groupGet1Test(){
			groupNameGet1.GET(groupQuery1, (data: any, statusCode: number) => {
				statusCode.should.equal(200)

				console.log("limit check")
				data.length.should.equal(10)

				console.log("skip check")
				expect(data.toString()).to.equal(dataA.slice(-10).toString())

				console.log("group name check")
				data.forEach((value, i) => {
					value.should.have.property('nodeId')
				})
				done();
			})
		}
	})

	it("use feature wrong limit parameter & should return status code as 403", (done) => {
		let groupQuery: GroupQueryParameter = {
			name : "test_group",
			limit: [1000]
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) => {
			statusCode.should.equal(403)
			data.should.equal('error, invalid param in limit')
			done()
		})
	})

	it("use feature wrong skip parameter & should return status code as 403", (done) => {
		let groupQuery: GroupQueryParameter = {
			name : "test_group",
			skip: [1000]
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) => {
			statusCode.should.equal(403)
			data.should.equal('error, invalid param in skip')
			done()
		})
	})

	it("use feature wrong order parameter & should return status code as 403", (done) => {
		let groupQuery: GroupQueryParameter = {
			name : "test_group",
			order: [1000]
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) => {
			statusCode.should.equal(403)
			data.should.equal('error, invalid param in order')
			done()
		})
	})

	it("use wrong sessionToken & should return status code as 401", (done) => {
		let groupQuery: GroupQueryParameter = {
			name : "test_group"
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken("wrong token")
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) => {
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	it("group admin that username is test_group & should return group:test_group ", (done) => {
		let groupQuery: GroupQueryParameter = {
			name: 'test_group'
		}
		let sessionToken = require('../../config').sessionToken.test_group
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery,(data: any, statusCode: number) => {
			data.forEach(function(val){
				val.should.have.property("nodeId")
			})
			statusCode.should.equal(200)
			done();
		})
	})

	it("normal admin that username is test & should return []", (done) => {
		let groupQuery: GroupQueryParameter = {
			name: 'test_group'
		}
		let sessionToken = require('../../config').sessionToken.test_guest
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery,(data: any, statusCode: number) => {
			data.length.should.equal(0)
			statusCode.should.equal(200)
			done();
		})
	})


})

