import md5 = require('md5')
import * as http from 'http'
import * as request from 'request'
import fs = require('fs')

const appkey = require('./../v1/config').AppKey
const appIDPath = "/../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')

class httpRequest {
	httpOption: any;
	constructor(url: string, path: string, port: number, method: string) {
		this.httpOption = {
			json: true,
			method: method,
			url: "http://" + url + ":" + port + path
		}
	}

	request(Check?: (data: any, statusCode: number) => void) {

		return request(this.httpOption, function(error, response, body) {
			Check(body, response.statusCode)
		});
	}
}

class AppRequest extends httpRequest {
	private getLCSign(): string{
		let timeStamp: number = new Date().valueOf() 
		let LCSign: string = timeStamp.toString() + appkey
		return md5(LCSign) + "," + timeStamp.toString()
	}

	setSessionToken(SessionToken: string) {
		this.httpOption.headers.SessionToken = SessionToken;
	}

	constructor(url: string, path: string, port: number, method: string) {
		super(url, path, port, method)
		this.httpOption.headers = {
			"Content-Type": "application/json",
			"X-LC-Id": appID,
			"X-LC-Sign": this.getLCSign()
		}
	}

}

export class AppPOST extends AppRequest {
	POST(postData: any, Check?: (data: any, statusCode: number) => void) {
		this.httpOption.body = postData;
		this.request(Check)
	}
	constructor(url: string, path: string, port: number) {
		super(url, path, port, "POST")
	}
}

export class AppPUT extends AppRequest {
	PUT(putData: any, Check?: (data: any, statusCode: number) => void) {
		this.httpOption.body = putData;
		this.request(Check)
	}
	constructor(url: string, path: string, port: number) {
		super(url, path, port, "PUT")
	}
}

export class AppDELETE extends AppRequest {
	DELETE<T>(deleteData: any, Check?: (data: any, statusCode: number) => void) {
		this.httpOption.qs = deleteData;
		this.request(Check)
	}
	constructor(url: string, path: string, port: number) {
		super(url, path, port, "DELETE")
	}
}

export class AppGET extends AppRequest {
	GET(getData: any, Check?: (data: any, statusCode: number) => void) {
		this.httpOption.qs = getData;
		this.request(Check)
	}
	constructor(url: string, path: string, port: number) {
		super(url, path, port, "GET")
	}
}

export class AppLogin extends AppPOST {
	login(postData: any, Check?: (data: any, statusCode: number) => void) {
		this.POST(postData, Check)
	}
	constructor(url: string, path: string, port: number) {
		super(url, path, port)
	}

}


