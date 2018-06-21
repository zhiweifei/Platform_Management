/**
 * Created by dev03 on 2018/6/7.
 */
module.exports = function (app) {
    app.use('/v1/node', require('./node'));
    app.use('/v1/node/count', require('./count/count'));
    app.use('/v1/node/nodeId', require('./nodeId/nodeId'));
    app.use('/v1/node/wlan', require('./wlan/wlan'));
    app.use('/v1/node/operator', require('./operator/operator'));
    app.use('/v1/node/lorawan', require('./lorawan/lorawan'));
};