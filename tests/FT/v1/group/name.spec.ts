import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppGET } from "../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../lib/sort"
import querystring = require('querystring');
import { GroupQueryParameter, GroupPutParameter} from "./lib/parameter"

let sessionToken = require('../config').sessionToken.test_super
const groupNamePath = "/v1/group/name"

const devurl = "protocol-access-test.leanapp.cn";
const port = 80;


describe('Get /v1/group/name', () => {

	it("default parameter should return 1000 group data by descend", (done) => {
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET("", (data: any, statusCode: number) =>{
			//data.length.should.equal(1000)
			expect(data.length).to.be.at.most(1000)
			statusCode.should.equal(200)
			//Check if sortby created time and use descend
			sortDateCheck(data, "dsc", "createAt")
			done()
		})
	})

	it("use limit 20 &  should return 20 group data", (done) => {
		let groupQuery: GroupQueryParameter = {
			limit: 20
		}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) =>{
			data.length.should.equal(20)
			statusCode.should.equal(200)
			done()
		})
	})

	it("use limit 10 and skip 10 &  should return 10 group data with 10 skip", (done) => {
		console.log("Get 40 data at first")
		let groupQuery: GroupQueryParameter = {
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
			limit: 10,
			skip: 10
		}
		let groupNameGet1 = new AppGET(devurl, groupNamePath, port)
		groupNameGet1.setSessionToken(sessionToken)
	})

	it("use sortby to sort date by name, createTime & should only return be sorted data", (done) => {
		let sortArray: Array<string> = [];

		function sortCheck(sortby: string) {
			let groupQuery: GroupQueryParameter = {
				sortby: sortby
			}
			let groupNameGet = new AppGET(devurl, groupNamePath, port)
			groupNameGet.setSessionToken(sessionToken)
			groupNameGet.GET(groupQuery, (data: any, statusCode: number) => {
				statusCode.should.equal(200)
				sortCommonCheck(data, "dsc", sortby)
				sortArray.push(sortby)
				if(sortArray.indexOf("name") >= 0 && sortArray.indexOf("createTime") >= 0){
					done();
				}
			})
		}

		console.log("sortby name")
		sortCheck("name")

		console.log("sortby createTime")
		sortCheck("createTime")
	})

	it("use order as asc & should return data sort as ascend", (done) => {
		let groupQuery: GroupQueryParameter = {
				order: "asc"
			}
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET(groupQuery, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			sortDateCheck(data, groupQuery.order, "createdAt")
			done();
		})


	})

	it("Comprehensive test & should return data limit 100 with skip 10, filter data use sortby name order as ascend", (done) => {
		console.log("Get 20 data at first")
		let dataA: any
		let groupQuery: GroupQueryParameter = {
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
					value.should.have.property('name')
				})

				console.log("sortby and order check")
				sortCommonCheck(data, "asc", "name")
				done();
			})
		}
	})

	it("use feature wrong parameter & should return status code as 403", (done) => {
		let groupQuery: GroupQueryParameter = {
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

	it("use wrong sessionToken & should return status code as 401", (done) => {
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken("wrong token")
		groupNameGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	it("group admin that username is test_group & should return group:test_group ", (done) => {
		let sessionToken = require('../config').sessionToken.test_group
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET("",(data: any, statusCode: number) => {
			console.log('data statusCode',data,statusCode);
			data.forEach(function(val){
				val.should.have.property("name")
				val["name"].should.equal("test_group")
			})
			statusCode.should.equal(200)
			done();
		})
	})

	it("normal admin that username is test & should return []", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let groupNameGet = new AppGET(devurl, groupNamePath, port)
		groupNameGet.setSessionToken(sessionToken)
		groupNameGet.GET("",(data: any, statusCode: number) => {
			console.log('data',data);
			data.length.should.equal(1)
			statusCode.should.equal(200)
			done();
		})
	})


})

