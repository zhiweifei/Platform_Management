import fs = require('fs')
import { expect } from 'chai'
import 'chai/register-should'
import 'mocha'
import { AppGET, AppPOST, AppPUT, AppDELETE } from "../../lib/http-tools"
import { sortCommonCheck, sortDateCheck } from "../../lib/sort"
import * as AV from 'leancloud-storage';
import { GroupQueryParameter, GroupBodyParameter, GroupPutParameter} from "./lib/parameter"

const devurl = "protocol-access-test.leanapp.cn"
const appkey = require('../config').AppKey
const masterKey = require('../config').MasterKey
const appIDPath = "/../../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')
const groupPath = "/v1/group"
const port = 80
class Group extends AV.Object {}
AV.Object.register(Group)
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

describe('Get /v1/group', () => {
	let sessionToken = require('../config').sessionToken.test_super

	it("default parameter should return 1000 group data by descend", (done) => {
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) =>{
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
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET(groupQuery, (data: any, statusCode: number) =>{
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
		let groupGet = new AppGET(devurl, groupPath, port)
		let dataA: any
		groupGet.setSessionToken(sessionToken)
		groupGet.GET(groupQuery, (data: any, statusCode: number) =>{
			data.length.should.equal(20)
			statusCode.should.equal(200)
			dataA = data
			groupGet1.GET(groupQuery1, (data: any, statusCode: number) =>{
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
		let groupGet1 = new AppGET(devurl, groupPath, port)
		groupGet1.setSessionToken(sessionToken)
	})

	it("use group 'test_group' to filter data & should only return sepcify user data", (done) => {	
		let groupQuery: GroupQueryParameter = {
			name: ["test_group"]
		}	
		let groupGet = new AppGET(devurl, groupPath, port)
		let dataA: any
		groupGet.setSessionToken(sessionToken)
		groupGet.GET(groupQuery, (data: any, statusCode: number) =>{
			statusCode.should.equal(200)
			data.forEach((value, i) => {
				value.should.have.property('name')
				value.name.should.satisfy((name) => {
					if(name == groupQuery.name[0] || name == groupQuery.name[1]) {
						return true;	
					}
					else {
						return false;
					}
				})
			})
			done();
		})

	})

	it("use sortby to sort date by name, createTime & should only return be sorted data", (done) => {
		let sortArray: Array<string> = [];

		function sortCheck(sortby: string) {
			let groupQuery: GroupQueryParameter = {
				sortby: sortby
			}
			let groupGet = new AppGET(devurl, groupPath, port)
			groupGet.setSessionToken(sessionToken)
			groupGet.GET(groupQuery, (data: any, statusCode: number) => {
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
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET(groupQuery, (data: any, statusCode: number) => {
			statusCode.should.equal(200)
			sortDateCheck(data, groupQuery.order, "createdAt")
			done();
		})

	})

	it("Comprehensive test & should return data limit 10 with skip 10, filter data use  sortby name order as ascend", (done) => {
		console.log("Get 20 data at first")
		let dataA: any
		let groupQuery: GroupQueryParameter = {
				limit: 20,
				sortby: "name",
				order: "asc"
			}
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET(groupQuery, (data: any, statusCode: number) => {
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
		let groupGet1 = new AppGET(devurl, groupPath, port)
		groupGet1.setSessionToken(sessionToken)
		function groupGet1Test(){
			groupGet1.GET(groupQuery1, (data: any, statusCode: number) => {
				statusCode.should.equal(200)

				console.log("limit check")
				data.length.should.equal(10)

				console.log("skip check")
				expect(data.toString()).to.equal(dataA.slice(-10).toString())

				console.log("sortby and order check")
				sortCommonCheck(data, "asc", "name")
				done();
			})
		}
	})


	it("use inexistent groupname & should return data []", (done) => {
		let groupQuery: GroupQueryParameter = {
				name:["inexistent"]
			}
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET(groupQuery, (data: any, statusCode: number) => {
			data.length.should.equal(0)
			done();
		})
	})

	it("use feature wrong parameter & should return status code as 403", (done) => {
		let checkArray: Array<string> = []

		function paramCheck(getParameter: any, paramError: string, param){
			let groupGet = new AppGET(devurl, groupPath, port)
			groupGet.setSessionToken(sessionToken)
			groupGet.GET(getParameter, (data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal(paramError)
				checkArray.push(param)
				if(checkArray.indexOf("name") >= 0 && checkArray.indexOf("limit") >= 0 &&
					checkArray.indexOf("skip") >= 0 && checkArray.indexOf("sortby") >= 0 &&
					checkArray.indexOf("order") >= 0){
					done()
				}
			})
		}

		console.log("check name")
		let wrong_name: GroupQueryParameter = {
			name: "name"
		}
		paramCheck(wrong_name, "error, invalid param in name", "name")

		console.log("check limit")
		let wrong_limit: GroupQueryParameter = {
			limit: [100]
		}
		paramCheck(wrong_limit, "error, invalid param in limit", "limit")

		console.log("check skip")
		let wrong_skip: GroupQueryParameter = {
			skip: [100]
		}
		paramCheck(wrong_skip, "error, invalid param in skip", "skip")

		console.log("check sortby")
		let wrong_sortby: GroupQueryParameter = {
			sortby: ["name"]
		}
		paramCheck(wrong_sortby, "error, invalid param in sortby", "sortby")

		console.log("check order")
		let wrong_order: GroupQueryParameter = {
			order: ["asc"]
		}
		paramCheck(wrong_order, "error, invalid param in order", "order")

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
		let sessionToken = require('../config').sessionToken.test_group
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) => {
			data.forEach(function(val){
				val.should.have.property("name")
				val["name"].should.equal("test_group")
			})
			statusCode.should.equal(200)
			done();
		})
	})

	it("normal admin that username is test & should return group:test_group", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let groupGet = new AppGET(devurl, groupPath, port)
		groupGet.setSessionToken(sessionToken)
		groupGet.GET("",(data: any, statusCode: number) => {
			data.length.should.equal(1)
			statusCode.should.equal(200)
			done();
		})
	})

})

describe('Post /v1/group', () => {
	let sessionToken = require('../config').sessionToken.test_super
	let groupData: any
	let newGroup: Array<GroupBodyParameter>

	afterEach((done) => {
		let query = new AV.Query('Group');
		query.equalTo("name", newGroup[0].name)
		query.find({useMasterKey: true}).then(function(td){
			AV.Object.destroyAll(td, {useMasterKey: true}).then(function (success) {
			// delete success
				done()
			}, function (error) {
			// delete fail
				done()
			});

		})
	})

	it("create new group with name& should return 'error'", (done) => {
		newGroup = [{
			name: "testGroup" + new Date().getTime()
		}]
		let groupPost = new AppPOST(devurl, groupPath, port)
		groupPost.setSessionToken(sessionToken)
		groupPost.POST(newGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("error, params include user or groupInfo at least one");
				done()
			})
	})

	it("create new group with name, user, and groupInfo & should return 'success, relate to users successfully'", (done) => {
		newGroup = [{
			name: "testGroup" + new Date().getTime(),
			user: ["test"],
			groupInfo: "testInfo"
		}]
		let groupPost = new AppPOST(devurl, groupPath, port)
		groupPost.setSessionToken(sessionToken)
		groupPost.POST(newGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, build group successfully")
				done()
			})

	})

	it("create duplicate group & should return 403 status code", (done) => {
		newGroup = [{
			name: "testGroup" + new Date().getTime(),
			user: ["test"],
			groupInfo: "testInfo"
		}]
		let groupPost = new AppPOST(devurl, groupPath, port)
		groupPost.setSessionToken(sessionToken)
		groupPost.POST(newGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(201)
				data.should.equal("success, build group successfully")
				groupPost.POST(newGroup,
					(data: any, statusCode: number) => {
						statusCode.should.equal(403)
						data.should.equal("The group name is occupied")
						done()
					})
			})

	})

	it("create group with invalid user & should return 403 status code", (done) => {
		newGroup = [{
			name: "testGroup" + new Date().getTime(),
			user: ["wrong"],
			groupInfo: "testInfo"
		}]
		let groupPost = new AppPOST(devurl, groupPath, port)
		groupPost.setSessionToken(sessionToken)
		groupPost.POST(newGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid user")
				done()
			})
	})

	it("create group with valid and invalid user & should return 403 status code", (done) => {
		newGroup = [{
			name: "testGroup" + new Date().getTime(),
			user: ["test", "wrong"],
			groupInfo: "testInfo"
		}]
		let groupPost = new AppPOST(devurl, groupPath, port)
		groupPost.setSessionToken(sessionToken)
		groupPost.POST(newGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("Invalid user")
				done()
			})
	})

	it("use feature wrong parameter & should return status code as 403", (done) => {
		let checkArray: Array<string> = []

		function paramCheck(getParameter: any, paramError: string, param){
			let groupPost = new AppPOST(devurl, groupPath, port)
			groupPost.setSessionToken(sessionToken)
			groupPost.POST(getParameter, (data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal(paramError)
				checkArray.push(param)
				if(checkArray.indexOf("name") >= 0 && checkArray.indexOf("user") >= 0 &&
					checkArray.indexOf("groupInfo") >= 0 && checkArray.indexOf("user") >= 0){
					done()
				}
			})
		}

		console.log("check name")
		let wrong_name: Array<GroupBodyParameter> = [{
			name: ["name"],
			user: ["test"]
		}]
		paramCheck(wrong_name, 'Invalid group name', "name")

		console.log("check user")
		let wrong_user: Array<GroupBodyParameter> = [{
			name: "test",
			user: "test"
		}]
		paramCheck(wrong_user, 'Invalid user', "user")

		console.log("check groupInfo")
		let wrong_groupInfo: Array<GroupBodyParameter> = [{
			name: "test",
			groupInfo: ["Info"]
		}]
		paramCheck(wrong_groupInfo, 'Invalid groupInfo', "groupInfo")

		let wrong_BodyInfo = {
			name: "test",
			groupInfo: ["Info"]
		}
		paramCheck(wrong_BodyInfo, 'error, invalid param in body', "body")
	})

	it("create group with wrong sessionToken & should return 403 status code", (done) => {
		newGroup = [{
			name: "testGroup" + new Date().getTime(),
			user: ["test"],
			groupInfo: "testInfo"
		}]
		let groupPost = new AppPOST(devurl, groupPath, port)
		groupPost.setSessionToken("wrong")
		groupPost.POST(newGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken")
				done()
			})
	})


})

describe('Put /v1/group', () => {
	let sessionToken = require('../config').sessionToken.test_super

	it("update group with only  name & should return 403 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [
				{
					name: "test_group",
				}
			]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal('error, params include newName,user groupInfo at least one')
				done()
			})
	})

	it("update group with groupInfo & should return 201 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				groupInfo: "groupInfoNew"
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, update group successfully")
				done()
			})
	})

	it("update group with newName & should return 201 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				newName: "test_group"
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, update group successfully")
				done()
			})
	})

	it("update group with user & should return 201 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				user: ["test"]
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(201)
				data.should.equal("success, update group successfully")
				done()
			})
	})

	it("update group with invalid user & should return 201 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				user: ["wrong"]
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal("Invalid user")
				done()
			})
	})

	it("update group with valid and invalid user & should return 201 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				user: ["test", "wrong"]
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(403)
				data.should.equal("Invalid user")
				done()
			})
	})

	it("update nonexistent group & should return 404 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
				name: "wrong",
				groupInfo:"groupInfoNew"
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal("error,some group is not find");
				done()
			})
	})

	it("update group with wrong name & should return 403 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
			name: "test_group",
			newName: ["group"]
		}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("error, invalid param in newName");
				done()
			})
	})

	it("update group with wrong user & should return 403 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
			name: "test_group",
			user: "test"
		}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("error, invalid param in user");
				done()
			})
	})

	it("update group with wrong groupInfo & should return 403 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
			name: "test_group",
			groupInfo: ["Info"]
		}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal("error, invalid param in groupInfo");
				done()
			})
	})

	it("use wrong sessionToken & should return 401 status code", (done) => {
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				groupInfo: "groupInfoNew"
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken("wrong sessionToken")
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("Invalid SessionToken");
				done()
			})
	})

	it("group admin update groupInfo & should return 401 status code", (done) => {
		let sessionToken = require('../config').sessionToken.test_group
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				groupInfo: "groupInfoNew"
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(404)
				data.should.equal("error,some group is not find");
				done()
			})
	})

	it("normal admin update groupInfo & should return 404 status code", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let updateGroup: Array<GroupPutParameter> = [{
				name: "test_group",
				groupInfo: "groupInfoNew"
			}]
		let groupPUT = new AppPUT(devurl, groupPath, port)
		groupPUT.setSessionToken(sessionToken)
		groupPUT.PUT(updateGroup,
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal("no authority to update group");
				done()
			})
	})


})
describe('Delete /v1/group', () => {
	let sessionToken = require('../config').sessionToken.test_super
	let groupData: any

	beforeEach((done) => {
		let deleteGroup: AV.Object = new Group()
		groupData = {
			name: "testDeleteGroup" + new Date().getTime(),
			groupInfo: "testGroup"
		};
		console.log('groupData',groupData.name);
		deleteGroup.set('name', groupData.name)
		deleteGroup.set('groupInfo', groupData.groupInfo)
		deleteGroup.save(null, {sessionToken: sessionToken}).then((objects) => {
			//TODO: Don't know why objects can't be iterated
			groupData.objectId = objects.id
			console.log("put fake data for delete, and objectIDs:", groupData.objectId)
			done();
		}, (error) => {
			console.error("put fake data error",error)
		})
	})

	afterEach((done) => {
		let deleteAlarm = AV.Object.createWithoutData('Group', groupData.objectId);
		deleteAlarm.destroy({useMasterKey: true}).then(function (success) {
		// delete success
			console.log("delete fake data success")
			done()
		}, function (error) {
		// delete fail
			console.error("delete fake data error", error)
			done()
		})
	})

	it("use name as specify & should return 204", (done) => {
		let groupDelete = new AppDELETE(devurl, groupPath, port)
		groupDelete.setSessionToken(sessionToken)
		console.log('groupData',groupData.name);
		groupDelete.DELETE({"name": [groupData.name]},
			(data: any, statusCode: number) => {
				console.log('data,statusCode',data,statusCode);
				statusCode.should.equal(204)
				done()
			})
	})

	it("use null as specify & should return 403", (done) => {
		let groupDelete = new AppDELETE(devurl, groupPath, port)
		groupDelete.setSessionToken(sessionToken)
		groupDelete.DELETE({},
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal('error, invalid param in name')
				done()
			})
	})

	it("use inexistent group & should return 404 status code and 'error,some group not find'", (done) => {
		let groupDelete = new AppDELETE(devurl, groupPath, port)
		groupDelete.setSessionToken(sessionToken)
		groupDelete.DELETE({"name": ["wrong group"]},
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal('error,some group not find')
				done()
		})
	})

	it("use wrong parameter & should return 403 status code", (done) => {
		let groupDelete = new AppDELETE(devurl, groupPath, port)
		groupDelete.setSessionToken(sessionToken)
		groupDelete.DELETE({"name": 1},
			(data: any, statusCode: number) => {
				statusCode.should.equal(403)
				data.should.equal('error, invalid param in name')
				done()
		})
	})

	it("use wrong SessionToken & should return 401 status code", (done) => {
		let groupDelete = new AppDELETE(devurl, groupPath, port)
		groupDelete.setSessionToken("wrong token")
		groupDelete.DELETE({"name": [groupData.name]},
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal('Invalid SessionToken')
				done()
			})
	})

	it("group admin delete & should return 401 status code", (done) => {
		let sessionToken = require('../config').sessionToken.test_group
		let groupDelete = new AppDELETE(devurl, groupPath, port)
		groupDelete.setSessionToken(sessionToken)
		groupDelete.DELETE({"name": [groupData.name]},
			(data: any, statusCode: number) => {
				statusCode.should.equal(404)
				data.should.equal('error,some group not find')
				done()
			})
	})

	it("normal admin delete & should return 404 status code", (done) => {
		let sessionToken = require('../config').sessionToken.test
		let groupDelete = new AppDELETE(devurl, groupPath, port)
		groupDelete.setSessionToken(sessionToken)
		groupDelete.DELETE({"name": ["test_group"]},
			(data: any, statusCode: number) => {
				console.log('data statusCode',data,statusCode);
				statusCode.should.equal(401)
				data.should.equal('no authority to delete group')
				done()
			})
	})

})
