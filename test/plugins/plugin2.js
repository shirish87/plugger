var debug = require('debug')('plugin2')

module.exports.name = 'plugin2';

module.exports.priority = 1;


module.exports.init = function (hook) {
    hook('event2', function () {
        debug('invoked: event2');
    });
}