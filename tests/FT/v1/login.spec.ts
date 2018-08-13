import delay = require('delay');
import 'chai/register-should'
import 'mocha'
import { AppLogin } from "../lib/http-tools"

const devurl = "localhost"
const devurlPath = "/v1/login"
const config = require('./config');
const port = parseInt(process.env.PORT || config.port)

let postData =  {
	'username' : "test",
	'password': "test"
};
//let postData_sessionToken = '8dm8rcnvg2l76w0ddl0kdfwiq';
let postWrongUsername = {
	'username' : "wrong",
	'password': "test"
};
let postWrongPassword = {
	'username' : "test",
	'password': "wrong"
};


describe('POST /v1/login', () => {

	let appLogin = new AppLogin(devurl, devurlPath, port)
	afterEach(function(done) {
		this.timeout(7000)
		console.log("Waiting 6s to avoid too many request error")
		delay(6000).then(() => {
			done()
		})
	})

	it('should return SessionToken', (done) => {
		appLogin.login(postData,
			(data: any, statusCode: number) => {
				console.log('login# data,statusCode',data,statusCode);
				data.should.have.property("sessionToken")
				statusCode.should.equal(200)
				done()
			});
	});

	it('Give wrong username, should Could not find user.', (done) => {
		appLogin.login(postWrongUsername,
			(data: any, statusCode: number) => {
				console.log('login# data,statusCode',data,statusCode);
				//data.should.have.property('error');
				data.should.equal('Could not find user.')
				statusCode.should.equal(211)
				done()
			});
	});

	it('Give wrong password, should return The username and password mismatch.', (done) => {
		appLogin.login(postWrongPassword,
			(data: any, statusCode: number) => {
				console.log('login# data,statusCode',data,statusCode);
				data.should.equal('The username and password mismatch.')
				statusCode.should.equal(210)
				done()
			});
	});

	it.skip('login fail too much should return 登录失败次数超过限制，请稍候再试，或者通过忘记密码重设密码。', (done) => {

		function ErrorLogin() {
			appLogin.login(postWrongPassword, function(data: any, statusCode: number){
				console.log('login# data,statusCode',data,statusCode)
				if(data== '登录失败次数超过限制，请稍候再试，或者通过忘记密码重设密码。'){
					done()
				}else{
					ErrorLogin()
				}
			})
		}
		ErrorLogin()
	});
});
