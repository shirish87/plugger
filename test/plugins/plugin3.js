var debug = require('debug')('plugin3')

module.exports.name = 'plugin3';

module.exports.priority = 1;


module.exports.init = function (hook) {
    hook('event3', function () {
        debug('invoked: event3');
    });
}