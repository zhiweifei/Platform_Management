import md5 = require('md5')
import WebSocket = require('ws')
import fs = require('fs')

const appkey = require('../../../config').AppKey
const appIDPath = "/../../../.leancloud/current_app_id"
const appID = fs.readFileSync(__dirname + appIDPath, 'utf8')

export default class websocket {
	wsOption: {headers: any};
	ws: any;

	setSessionToken(SessionToken: string) {
		this.wsOption.headers["sessionToken"] = SessionToken;
	}

	close() {
		return this.ws.terminate();
	}

	open():Promise<any> {
		return new Promise((resolve, reject) => {
			this.ws.on('open', () => {
				resolve();
			})
		})
	}

	error(error: (err) => void) {
		this.ws.on('error', error)
	}
	send(msg: any) {
		this.ws.send(msg)
	}

	message(receive: (data: any) => void) {
		this.ws.on('message', receive)
	}

	constructor(url: string, path: string, port: number, sessionToken: string) {
		this.wsOption = {
			headers: {
				"Content-Type": "application/json",
				"sessionToken": sessionToken
			}
		}
		this.ws = new WebSocket("ws://" + url + ":" + port.toString() + path, this.wsOption)
	}
}
