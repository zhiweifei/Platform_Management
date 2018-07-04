module.exports = function (app) {

	app.use("/v1/user/count", require("./count"));
	app.use("/v1/user", require("./user"));
	app.use("/v1/user/name",  require("./name"));
	app.use("/v1/user/password",  require("./password"));
	app.use("/v1/user/verify",  require("./verify"));
	app.use("/v1/user/authData",  require("./authData"));

};