import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppPUT, AppGET, AppPOST, AppDELETE } from "../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../lib/sort"
import querystring = require('querystring');
import * as AV from 'leancloud-storage';
import { UserNameGetParameter, UserNamePutParameter} from "./lib/parameter"

const appkey = require('../config').AppKey
const masterKey = require('../config').MasterKey
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const userPath = "/v1/user/name"
//const devurl = "localhost"
//const port = parseInt(process.env.PORT || require("../config").port)
const devurl = "protocol-access.leanapp.cn";
const port = 80;

describe('Get /v1/user/name', () => {
	let sessionToken = require('../config').sessionToken.test_super

	it("should return 1000 user data", (done) => {
		let userNameGet = new AppGET(devurl, userPath, port)
		userNameGet.setSessionToken(sessionToken)
		userNameGet.GET("", (data: any, statusCode: number) => {
			//data.length.should.equal(1000)
			expect(data.length).to.be.at.most(1000)
			statusCode.should.equal(200)
			data.forEach(function(val){
				val.should.have.property("username")
			})
			done()
		})
	})

	it("use limit 20 & should return 20 user data", (done) => {		
		let getParameter: UserNameGetParameter = {
			limit: 20
		}
		let userNameGet = new AppGET(devurl, userPath, port)
		userNameGet.setSessionToken(sessionToken)
		userNameGet.GET(getParameter, (data: any, statusCode: number) => {
			//data.length.should.equal(20)
			expect(data.length).to.be.at.most(20)
			statusCode.should.equal(200)
			data.forEach(function(val){
				val.should.have.property("username")
			})
			done()
		})
	})

	it("use limit 10 and skip 10 & should return 10 user data with 10 skip", (done) => {
		console.log("Get 40 data at first")
		let getParameter: UserNameGetParameter = {
			limit: 20
		}
		let userNameGet = new AppGET(devurl, userPath, port)
		let dataA: any
		userNameGet.setSessionToken(sessionToken)
		userNameGet.GET(getParameter, (data: any, statusCode: number) => {
			data.length.should.equal(20)
			statusCode.should.equal(200)
			data.forEach(function(val){
				val.should.have.property("username")
			})
			dataA = data
			userNameGet1Test()
		})

		console.log("Skip 10 data and get 10 data, then compare")
		let getParameter1: UserNameGetParameter = {
			limit: 10,
			skip: 10
		}
		let userNameGet1 = new AppGET(devurl, userPath, port)
		userNameGet1.setSessionToken(sessionToken)
		function userNameGet1Test(){
			userNameGet1.GET(getParameter1,(data: any, statusCode: number) => {
				data.length.should.equal(10)
				statusCode.should.equal(200)
				data.forEach(function(val){
					val.should.have.property("username")
				})
				expect(data).to.eql(dataA.slice(-10))
				done()
			})
		}
	})

	it("use sortby to sort date by name, createTime & should only return be sorted data", (done) => {
		let sortArray: Array<string> = [];
		function sortCheck(sortby: string) {
			let getParameter: UserNameGetParameter = {
				sortby: sortby
			}
			let userNameGet = new AppGET(devurl, userPath, port)
			userNameGet.setSessionToken(sessionToken)
			userNameGet.GET(getParameter, (data: any, statusCode: number) => {
				statusCode.should.equal(200)
				data.forEach(function(val){
					val.should.have.property("username")
				})
				sortCommonCheck(data, "dsc", sortby)
				sortArray.push(sortby)
				if(sortArray.indexOf("name") >= 0 && sortArray.indexOf("createTime") >= 0){
					done()
				}
			})		
		}

		console.log("sortby name")
		sortCheck("name")

		console.log("sortby createTime")
		sortCheck("createTime")
	})

	it("use order as asc & should return data sort as ascend", (done) => {
		let getParameter: UserNameGetParameter = {
			order: "asc"
		}
		let userNameGet = new AppGET(devurl, userPath, port)
		userNameGet.setSessionToken(sessionToken)
		userNameGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			sortDateCheck(data, getParameter.order, "createdAt")
			done();
		})
	})

	it("Comprehensive test & should return data limit 100 with skip 10, filter data use username as 'user1' , sortby username order as ascend", (done) => {
		console.log("Get 20 data at first")
		let dataA: any
		let getParameter: UserNameGetParameter = {
			limit: 20,
			sortby: "username",
			order: "asc"
		}
		let userNameGet = new AppGET(devurl, userPath, port)
		userNameGet.setSessionToken(sessionToken)
		userNameGet.GET(getParameter, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			dataA = data
			userNameGet1Test()
		})

		let getParameter1: UserNameGetParameter = {
			limit: 10,
			skip: 10,
			sortby: "username",
			order: "asc"
		} 
		let userNameGet1 = new AppGET(devurl, userPath, port)
		userNameGet1.setSessionToken(sessionToken)
		function userNameGet1Test(){
			userNameGet1.GET( getParameter1,(data: any, statusCode: number) => {
				statusCode.should.equal(200)
				data.forEach(function(val){
					val.should.have.property("username")
				})
				
				console.log("limit check")
				data.length.should.equal(10)

				console.log("skip check")
				expect(data).to.eql(dataA.slice(-10))

				console.log("sortby and order check")
				sortCommonCheck(data, "asc", "username")
				done();
			})
		}
	})


	it("use feature wrong parameter & should return status code as 403", (done) => {

		function paramCheck(getParameter: any, paramError: string, param){
			return new Promise(function(resolve, reject){
				let userNameGet = new AppGET(devurl, userPath, port)
				userNameGet.setSessionToken(sessionToken)
				userNameGet.GET(getParameter, (data: any, statusCode: number) => {
					statusCode.should.equal(403)
					data.should.equal(paramError)
					resolve()
				})
			})
		}

		console.log("check limit")
		let wrong_limit: UserNameGetParameter = {
			limit: [1]
		}
		let promise1 = paramCheck(wrong_limit, "error, invalid param in limit", "limit")

		console.log("check skip")
		let wrong_skip: UserNameGetParameter = {
			skip: [1]
		}
		let promise2 = paramCheck(wrong_skip, "error, invalid param in skip", "skip")

		console.log("check sortby")
		let wrong_sortby: UserNameGetParameter = {
			sortby: ["username"]
		}
		let promise3 = paramCheck(wrong_sortby, "error, invalid param in sortby", "sortby")

		console.log("check order")
		let wrong_order: UserNameGetParameter = {
			order: ["asc"]
		}
		let promise4 = paramCheck(wrong_order, "error, invalid param in order", "order")


		Promise.all([promise1, promise2, promise3, promise4]).then(function(value){
			done()
		}).catch(function(){
			done()
		})
	})

	it("use wrong sessionToken & should return status code as 401", (done) => {
		let userNameGet = new AppGET(devurl, userPath, port)
		userNameGet.setSessionToken("wrong sessionToken")
		userNameGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(401)
			data.should.equal('Invalid SessionToken')
			done();
		})
	})

	

	it("group admin that username is test_group & should return users in this group", (done) => {
		let sessionToken = require('../config').sessionToken.test_group
		let nodeInfoGet = new AppGET(devurl, userPath, port)
		nodeInfoGet.setSessionToken(sessionToken)
		nodeInfoGet.GET("", (data: any, statusCode: number) => {
			statusCode.should.equal(200)			
			data.forEach((value, i) => {
				value.should.have.property("username")
				value.username.should.satisfy((username) => {
					if(username == "test_group" || username == "test" || username == "test_1") {
							return true;	
						}else {
							return false;
					}
				})
			})
			done();
		})
	})	

	it("normal admin that username is test & should return user test", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let nodeInfoGet = new AppGET(devurl, userPath, port)
		nodeInfoGet.setSessionToken(sessionToken)
		nodeInfoGet.GET("",(data: any, statusCode: number) => {
			statusCode.should.equal(200)			
			data.forEach((value, i) => {
				value.should.have.property("username")
				value.username.should.equal("test")
			})
			done();
		})
	})

})

describe('Put /v1/user/name', () => {
	let sessionToken = require('../config').sessionToken.test
	let userData: any = {}
	let newUser: UserNamePutParameter

	it("update a user with username and userInfo & should 201 success", (done) => {
		newUser = {
			username: "test",
			newName: "test"
		}
		let userNamePut = new AppPUT(devurl, userPath, port)
		userNamePut.setSessionToken(sessionToken)
		userNamePut.PUT(newUser,
			(data: any, statusCode: number) => {
				console.log('data,statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, update user name successfully")
				done()
			})
	})

	it("invalid sessionToken & should return 401 Invalid SessionToken", (done) => {
		newUser = {
			username: "test",
			newName: "test"
		}
		let userNamePut = new AppPUT(devurl, userPath, port)
		userNamePut.setSessionToken("wrong sessionToken")
		userNamePut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken")
				done()
			})
	})

	it("user other user to update user test& should return 401 error", (done) => {
		let sessionToken = require('../config').sessionToken.test_super
		newUser = {
			username: "test",
			newName: "test"
		}
		let userNamePut = new AppPUT(devurl, userPath, port)
		userNamePut.setSessionToken(sessionToken)
		userNamePut.PUT(newUser,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("no authority to update the user")
				done()
			})
	})



})

