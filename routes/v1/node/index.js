/**
 * Created by dev03 on 2018/6/7.
 */
module.exports = function (app) {
    app.use('/v1/node', require('./node'));
    app.use('/v1/node/count', require('./count/count'));
    app.use('/v1/node/nodeId', require('./nodeId/nodeId'));
    app.use('/v1/node/tcpip', require('./tcpip/tcpip'));
    app.use('/v1/node/lorawan', require('./lorawan/lorawan'));
};