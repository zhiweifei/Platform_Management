import * as request from "request"

class http {
	options:any

    constructor(url, port, path) {
	 	this.options = {
	        json: true,
	        url: "http://" + url + ":" + port + path,
	        headers: {
	            "Content-Type": "application/json",
	            "Accept": "application/json"
	        }
	 	}
    }

    Request(callback?: (data: any, statusCode: number) => void){
    	request(this.options,function(error, response, body){
    		callback(body, response.statusCode)
    	})
    }
}

export default class httpRequest extends http {

    constructor(url: string, port: number, path: string) {
    	super(url, port, path)
    }

    setHeaders(headerOptions: any){
    	for (var i in headerOptions){
    		this.options.headers[i] = headerOptions[i]
    	}
    }

    GET(params: any, callback?: (data: any, statusCode: number) => void){
    	this.options.qs = params
		this.options.method = "GET"
    	this.Request(callback)
    }

    POST(params: any, callback?: (data: any, statusCode: number) => void){
    	this.options.body = params
		this.options.method = "POST"
    	this.Request(callback)
    }

    PUT(params: any, callback?: (data: any, statusCode: number) => void){
    	this.options.body = params
		this.options.method = "PUT"
    	this.Request(callback)
    }

    DELETE(params: any, callback?: (data: any, statusCode: number) => void){
    	this.options.qs = params
		this.options.method = "DELETE"
    	this.Request(callback)
    }

}