module.exports = function (app) {
    app.use('/v1/group', require('./group'));
    app.use('/v1/group/name', require('./groupName'));
    app.use('/v1/group/count', require('./count'));
    app.use('/v1/group/user', require('./groupUser'));
    app.use('/v1/group/nodeId', require('./groupNodeid'));
};