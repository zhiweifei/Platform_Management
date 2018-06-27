module.exports = function (app) {
    app.use('/v1/group', require('./group'));
    app.use('/v1/group/name', require('./groupName'));
    app.use('/v1/group/count', require('./count'));
};