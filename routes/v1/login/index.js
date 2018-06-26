module.exports = function (app) {
    app.use('/v1/login', require('./login'));
    app.use('/v1/login/authData', require('./loginAuth'));
};