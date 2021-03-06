import delay = require('delay');
import 'chai/register-should'
import 'mocha'
import { AppLogin } from "../lib/http-tools"

const devurl = "protocol-access-test.leanapp.cn";
const devurlPath = "/v1/login"
const config = require('./config');
const port = 80;

let postData =  {
	'username' : "test",
	'password': "test"
};
//let postData_sessionToken = '8dm8rcnvg2l76w0ddl0kdfwiq';
let postWrongUsername = {
	'username' : "wrong",
	'password': "test"
};
let postErrorUsername = {
	'username' : "testwrong",
	'password': "test"
};
let postWrongPassword_test_data_1 = {
	'username' : "test_data_1",
	'password': "wrong"
};
let postWrongPassword_test = {
	'username' : "test",
	'password': "wrong"
};


describe('POST /v1/login', () => {

	let appLogin = new AppLogin(devurl, devurlPath, port);
	afterEach(function(done) {
		this.timeout(7000)
		console.log("Waiting 6s to avoid too many request error")
		delay(6000).then(() => {
			done()
		})
	})

	it('testcase1# should return SessionToken', (done) => {
		appLogin.login(postData,
			(data: any, statusCode: number) => {
				console.log('POST /v1/login testcase1# data statusCode',data,statusCode);
				data.should.have.property("sessionToken")
				statusCode.should.equal(200)
				done()
			});
	});

	it('testcase2# Give error username, should Could not find user.', (done) => {
		appLogin.login(postErrorUsername,
			(data: any, statusCode: number) => {
				console.log('POST /v1/login testcase2# data statusCode',data,statusCode);
				//data.should.have.property('error');
				data.should.equal('Could not find user. ')
				statusCode.should.equal(211)
				done()
			});
	});

	it('testcase3# Give wrone username, should Could not find user.', (done) => {
		appLogin.login(postWrongUsername,
			(data: any, statusCode: number) => {
				console.log('POST /v1/login testcase3# data statusCode',data,statusCode);
				data.should.equal('Internal server error. No information available. ')
				statusCode.should.equal(401)
				done()
			});
	});

	it('testcase4# Give wrong password, should return The username and password mismatch.', (done) => {
		appLogin.login(postWrongPassword_test,
			(data: any, statusCode: number) => {
				console.log('POST /v1/login testcase4# data statusCode',data,statusCode);
				data.should.equal('The username and password mismatch. ');
				statusCode.should.equal(210)
				done()
			});
	});

	it('testcase5# login fail too much should return 登录失败次数超过限制，请稍候再试，或者通过忘记密码重设密码。', (done) => {

		function ErrorLogin() {
			appLogin.login(postWrongPassword_test_data_1, function(data: any, statusCode: number){
				console.log('POST /v1/login testcase5# data statusCode',data,statusCode);
				if(statusCode == 219){
					done()
				}else{
					ErrorLogin()
				}
			})
		}
		ErrorLogin()
	});
});
