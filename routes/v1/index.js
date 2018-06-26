/**
 * Created by dev03 on 2018/5/29.
 */
'use strict';

module.exports = function (app) {

    require('./node/index')(app);
    require('./login')(app);

};