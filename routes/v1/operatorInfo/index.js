/**
 * Created by dev03 on 2018/5/30.
 */
module.exports = function (app) {
    app.use('/v1/OperatorInfo', require('./operate'));
};