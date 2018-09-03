import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import httpRequest from "../../lib/http"
import {sortCommonCheck} from "../../lib/sort"
import * as AV from 'leancloud-storage'

const devurl = "protocol-access-test.leanapp.cn"
const path = "/v1/node"
const port = 80

const config = require("../config.json")
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const appkey = config.AppKey
const masterKey = config.MasterKey

class NodeInfo extends AV.Object {}
AV.Object.register(NodeInfo)
try{
	AV.init({
		appId: appID,
		appKey: appkey,
		masterKey: masterKey
	})
}
catch(e){
	console.error("Check init error:", e)
}

describe('Get /v1/node', function() {
	this.timeout(15000)

	it("default parameter should return 1000 data and statusCode 200", (done) => {
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.GET('',function(data, statusCode){	
			data.length.should.within(0,1000)
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
		http.GET(parameter,function(data, statusCode){	
			data.length.should.equal(10)
			statusCode.should.equal(200)
			done()
		})
	})

	it("skip 10 should return 1000 data skip 10 data and statusCode 200", (done) => {
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

	it("use nodeId ['b827eb563a2a'] should return  data that nodeId is 'b827eb563a2a'  and statusCode 200", (done) => {
		let parameter = {
			nodeId: ['b827eb563a2a']
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.GET(parameter,function(data, statusCode){
			data.forEach((value, i) => {
				value.nodeId.should.satisfy((nodeId) => {
					if(nodeId == parameter.nodeId[0]) {
						return true;	
					}
					else {
						return false;
					}
				})
			})
			statusCode.should.equal(200)
			done()
		})

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

	it("use inexistent nodeId should return statusCode 404", (done) => {
		let parameter = {
			nodeId: ["inexistent"]
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.GET(parameter,function(data, statusCode){	
			data.should.equal("query nodeId does not exist")
			statusCode.should.equal(404)
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

	// verify ACL
	it("super admin use nodeId ['b827eb563a2a'] should return  data that nodeId is 'b827eb563a2a' and statusCode 200", (done) => {
		let parameter = {
			nodeId: ['b827eb563a2a']
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.GET(parameter,function(data, statusCode){
			data.forEach((value, i) => {
				value.nodeId.should.satisfy((nodeId) => {
					if(nodeId == parameter.nodeId[0]) {
						return true;	
					}
					else {
						return false;
					}
				})
			})
			statusCode.should.equal(200)
			done()
		})
	})

	it("group admin use nodeId ['b827eb563a2a'] should return  data that nodeId is 'b827eb563a2a' and statusCode 200", (done) => {
		let parameter = {
			nodeId: ['b827eb563a2a']
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.GET(parameter,function(data, statusCode){
			console.log("data, statusCode", data, statusCode)
			data.forEach((value, i) => {
				value.nodeId.should.satisfy((nodeId) => {
					if(nodeId == parameter.nodeId[0]) {
						return true;	
					}
					else {
						return false;
					}
				})
			})
			statusCode.should.equal(200)
			done()
		})
	})

	it("normal admin that is test_guest use nodeId ['b827eb563a2a'] that not own should return statusCode 404", (done) => {
		let parameter = {
			nodeId: ['b827eb563a2a']
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_guest})
		http.GET(parameter,function(data, statusCode){
			data.should.equal("query nodeId does not exist")
			statusCode.should.equal(404)
			done()
		})
	})
})

describe('Post /v1/node', () => {
	let parameter

	afterEach((done) => {
		if(parameter.nodeId){
			let query = new AV.Query('NodeInfo')
			query.equalTo('nodeId',parameter.nodeId)
			query.first({useMasterKey: true}).then(node => {	
				if(node != undefined){
					let deleteUser = AV.Object.createWithoutData('NodeInfo', node.id)
					deleteUser.destroy({useMasterKey: true})
				}
				done()
			},function(err){
				done()
			})
		}else{
			done()
		}
	})

	it("with valid nodeId,AppKey,group,protocol should return  'build nodeInfo successfully' and statusCode 201", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){		
			data.should.equal("build nodeInfo successfully")
			statusCode.should.equal(201)
			done()
		})
	})

	it("with nodeId's length  not eauql 8 bytes return 'error, invalid param in nodeId' and statusCode 403", (done) => {
		parameter = {
			nodeId: "" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){		
			data.should.equal("error length nodeId")
			statusCode.should.equal(403)
			done()
		})
	})

	it("without nodeId should return  'error, invalid param in nodeId' and statusCode 403", (done) => {
		parameter = {
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){	
			data.should.equal("error, invalid param in nodeId")
			statusCode.should.equal(403)
			done()
		})
	})

	it("with AppKey's length  not eauql 16 bytes return 'error length AppKey' and statusCode 403", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "1234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){		
			data.should.equal("error length AppKey")
			statusCode.should.equal(403)
			done()
		})
	})

	it("without AppKey should return  'error, invalid param in AppKey' and statusCode 403", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){	
			data.should.equal("error, invalid param in AppKey")
			statusCode.should.equal(403)
			done()
		})
	})

	it("without group should return  'error, invalid param in group' and statusCode 403", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){	
			data.should.equal("error, invalid param in group")
			statusCode.should.equal(403)
			done()
		})
	})

	it("without protocol should return  'error, invalid param in protocol' and statusCode 403", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){	
			data.should.equal("error, invalid param in protocol")
			statusCode.should.equal(403)
			done()
		})
	})

	it("use exist nodeid should return  'nodeid is occupied' and statusCode 403", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.POST(parameter,function(data, statusCode){	
			console.log("post id",data, statusCode)
			data.should.equal("build nodeInfo successfully")
			statusCode.should.equal(201)
			let http = new httpRequest(devurl, port, path)
			http.setHeaders({sessionToken: config.sessionToken.test_super})
			http.POST(parameter,function(data, statusCode){
				data.should.equal("The nodeId is occupied")
				statusCode.should.equal(403)
				done()
			})
		})
	})

	it("invalid sessionToken should return message 'Invalid SessionToken' and statusCode 401", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: "wrong"})
		http.POST(parameter,function(data, statusCode){		
			data.should.equal("Invalid SessionToken")
			statusCode.should.equal(401)
			done()
		})
	})

	it("user not relation to any group should return message 'no authority' and statusCode 404", (done) => {
		parameter = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_guest})
		http.POST(parameter,function(data, statusCode){	
			data.should.equal("error related group")
			statusCode.should.equal(403)
			done()
		})
	})

})

describe('Put /v1/node', function() {

	this.timeout(15000)

	let parameterData

	beforeEach((done) => {
		parameterData = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test})
		http.POST(parameterData,function(data, statusCode){
			statusCode.should.equal(201)
			done()
		})
	})

	afterEach((done) => {
		let query = new AV.Query('NodeInfo');
		query.equalTo('nodeId',parameterData.nodeId);
		query.first({useMasterKey: true}).then(node => {
			if(node != undefined){
				console.log("delete objectId", node.id)	
				let deleteUser = AV.Object.createWithoutData('NodeInfo', node.id)
				return deleteUser.destroy({useMasterKey: true})
			}else{
				return
			}
		}).then(function(){
			done()
		}).catch(function(){
			done()
		})
	})

	it("update nodeid with nodeid & AppKey & nodeInfo & protocol should return message 'update nodeInfo successfully' and statusCode 201", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
			AppKey: "12345678123456781234567812345678",
			nodeInfo: "info",
			protocol: "tcp"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.PUT(parameter,function(data, statusCode){		
			data.should.equal("update nodeInfo successfully")
			statusCode.should.equal(201)
			done()
		})
	})

	it("update nodeid with nodeid & AppKey should return message 'update nodeInfo successfully' and statusCode 201", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
			AppKey: "12345678123456781234567812345678"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.PUT(parameter,function(data, statusCode){		
			data.should.equal("update nodeInfo successfully")
			statusCode.should.equal(201)
			done()
		})
	})

	it("update nodeid with nodeid & nodeInfo should return message 'update nodeInfo successfully' and statusCode 201", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
			nodeInfo: "info"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.PUT(parameter,function(data, statusCode){		
			data.should.equal("update nodeInfo successfully")
			statusCode.should.equal(201)
			done()
		})
	})

	it("update nodeid with nodeid & protocol should return message 'update nodeInfo successfully' and statusCode 201", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
			protocol: "tcp"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.PUT(parameter,function(data, statusCode){		
			data.should.equal("update nodeInfo successfully")
			statusCode.should.equal(201)
			done()
		})
	})

	it("update nodeid without nodeid  should return message 'Invalid nodeId' and statusCode 403", (done) => {
		let parameter = [{
			AppKey: "12345678123456781234567812345678",
			nodeInfo: "info",
			protocol: "tcp"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.PUT(parameter,function(data, statusCode){		
			data.should.equal("Invalid nodeId")
			statusCode.should.equal(403)
			done()
		})
	})

	it("update nodeid with only nodeid  should return message 'At least one updateInfo not include nodeId' and statusCode 403", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.PUT(parameter,function(data, statusCode){		
			data.should.equal("At least one updateInfo not include nodeId")
			statusCode.should.equal(403)
			done()
		})
	})

	// verify ACL
	it("super admin update nodeid should return message 'nodeId not found or no authority' and statusCode 404", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
			AppKey: "12345678123456781234567812345678",
			nodeInfo: "info",
			protocol: "tcp"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.PUT(parameter,function(data, statusCode){	
			data.should.equal("no authority to update nodeInfo")
			statusCode.should.equal(403)
			done()
		})
	})

	it("group admin update nodeid should return message 'update success' and statusCode 201", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
			AppKey: "12345678123456781234567812345678",
			nodeInfo: "info",
			protocol: "tcp"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.PUT(parameter,function(data, statusCode){
			data.should.equal("update nodeInfo successfully")
			statusCode.should.equal(201)
			done()
		})
	})

	it("normal admin update nodeid should return message 'nodeId not found or no authority' and statusCode 404", (done) => {
		let parameter = [{
			nodeId: parameterData.nodeId,
			AppKey: "12345678123456781234567812345678",
			nodeInfo: "info",
			protocol: "tcp"
		}]
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test})
		http.PUT(parameter,function(data, statusCode){	
			data.should.equal("no authority to update nodeInfo")
			statusCode.should.equal(403)
			done()
		})
	})

})

describe('Delete /v1/node', function() {

	this.timeout(15000)

	let parameterData

	beforeEach((done) => {
		parameterData = {
			nodeId: "000" + new Date().getTime(),
			AppKey: "12345678123456781234567812345678",
			group: "test_group",
			protocol: "tcp"
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test})
		http.POST(parameterData,function(data, statusCode){
			statusCode.should.equal(201)
			done()
		})
	})

	afterEach((done) => {
		let query = new AV.Query('NodeInfo');
		query.equalTo('nodeId',parameterData.nodeId);
		query.first({useMasterKey: true}).then(node => {
			if(node != undefined){
				console.log("delete objectId", node.id)	
				let deleteUser = AV.Object.createWithoutData('NodeInfo', node.id)
				return deleteUser.destroy({useMasterKey: true})
			}else{
				return
			}
		}).then(function(){
			done()
		}).catch(function(){
			done()
		})
	})


	
	it("without nodeId  should return message 'nodeId not found or no authority' and statusCode 404", (done) => {
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.DELETE("",function(data, statusCode){	
			data.should.equal("nodeId not found or no authority")
			statusCode.should.equal(404)
			done()
		})
	})	

	it("with wrong nodeId  should return message 'nodeId not found or no authority' and statusCode 404", (done) => {
		let parameter = {
			nodeId: ["wrong_nodeId"]
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.DELETE("",function(data, statusCode){		
			data.should.equal("nodeId not found or no authority")
			statusCode.should.equal(404)
			done()
		})
	})

	it("invalid sessionToken should return message 'Invalid SessionToken' and statusCode 401", (done) => {
		let parameter = {
			nodeId: [parameterData.nodeId]
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: "wrong"})
		http.POST(parameter,function(data, statusCode){		
			data.should.equal("Invalid SessionToken")
			statusCode.should.equal(401)
			done()
		})
	})

// verify ACL
	it("use group admin 'test_group'  should return statusCode 204", (done) => {
		let parameter = {
			nodeId: [parameterData.nodeId]
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_group})
		http.DELETE(parameter,function(data, statusCode){	
			statusCode.should.equal(204)
			done()
		})
	})

	it("use super admin 'test_super'should return message 'nodeId not found or no authority' and statusCode 404", (done) => {
		let parameter = {
			nodeId: [parameterData.nodeId]
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test_super})
		http.DELETE(parameter,function(data, statusCode){	
			data.should.equal("no authority to delete nodeInfo")
			statusCode.should.equal(403)
			done()
		})
	})

	it("use normal admin 'test' should return message 'nodeId not found or no authority' and statusCode 404", (done) => {
		let parameter = {
			nodeId: [parameterData.nodeId]
		}
		let http = new httpRequest(devurl, port, path)
		http.setHeaders({sessionToken: config.sessionToken.test})
		http.DELETE(parameter,function(data, statusCode){	
			data.should.equal("no authority to delete nodeInfo")
			statusCode.should.equal(403)
			done()
		})
	})



})
