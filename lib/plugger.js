var Hooker = require('hooker')
  , utils = require('./utils')
  , debug = require('debug')('plugger')


/*
 Every plugin must follow this protocol /or as specified when creating a Plugger instance
 */
var DEF_PROTOCOL = {
    main: 'init'
  , id: 'name'
  , orderBy: 'priority'
  , contract: {
        init: 'function'
      , priority: 'number'
      , name: 'string'
    }
}


/**
 * Filter to be used for detecting plugin files
*/
function defaultFilter(filename) {
    return /.*\.(js|coffee)$/.test(filename);
}


/**
 * Cache
 */
var slice = Array.prototype.slice;



/**
 * Plugger that plugs the plugins
 * @param modules       List of plugin dirs. Array with each item containing 'path' and 'depth' properties.
 * @param protocol      Protocol to be followed by all plugin files
 * @param callback      Notifies of invocation errors or completion of all invocations
 * @returns {Plugger}
 * @constructor
 */
function Plugger(modules, protocol, callback) {
    if (!(this instanceof Plugger)) return new Plugger(modules, protocol, callback);

    if (arguments.length === 2 && typeof protocol === 'function') {
        callback = protocol;
        protocol = null;
    }

    this._protocol = protocol || DEF_PROTOCOL;
    this._plugins = [];

    this._hooker = new Hooker(function (err) {
        callback(err);
    });


    var self = this;

    // expose hooker methods
    [
        'hook'
      , 'invoke'
      , 'seal'
    ].forEach(function (fn) {
        self[fn] = self._hooker[fn].bind(self._hooker);
    });


    // scan for plugins
    for (var i = 0, l = modules.length; i < l; i++) {
        var module = modules[i];
        var opts = {
            depth: module.depth || 1
        };

        if (typeof module.filter === 'function') {
            opts.filter = module.matcher;
        } else {
            opts.filter = defaultFilter;
        }

        utils.loadModules(module.path, opts, function (err, module, path) {
            if (err) {
                console.warn('Error loading plugin: ' + err + ' | ' + path);
                return;
            }

            if (module) {
                if (self._isValidModule(module)) {
                    debug('Loaded plugin: ' + module[self._protocol.id]);
                    self._plugins.push(module);
                } else {
                    console.warn('Unrecognized plugin protocol: ' + path);
                }
            }
        });
    }


    this._plugins.sort(function (a, b) {
        return a[self._protocol.orderBy] - b[self._protocol.orderBy];
    });
}


/**
 * Initializes all detected plugins by calling the protocol.main function in the order of protocol.orderBy
 * Plugins are expected to register their hooks in protocol.main
 */
Plugger.prototype.init = function () {
    debug('init');

    var plugins = this._plugins;
    var protocol = this._protocol;

    var args = slice.call(arguments);
    args.unshift(this._hooker);
    args.unshift(this.hook);

    for (var i = 0, l = plugins.length; i < l; i++) {
        var plugin = plugins[i];
        debug('initialzing plugin: ' + plugin[protocol.id]);
        plugin[protocol.main].apply(plugin, args);
    }
}


/**
 * Retrieve the require'd plugin module by protocol.id
 * @param idValue
 * @returns {*}
 */
Plugger.prototype.getPlugin = function (idValue) {
    var plugins = this._plugins;
    var options = this._options;
    var id = this._protocol.id;

    for (var i = 0, l = plugins.length; i < l; i++) {
        if (plugins[i][id] === idValue) {
            return plugins[i];
        }
    }

    return false;
}


/**
 * Checks if require'd module follows the specified protocol, i.e. module is a plugin
 * @param module        require'd module
 * @returns {boolean}
 * @private
 */
Plugger.prototype._isValidModule = function (module) {
    var protocol = this._protocol;

    if (typeof module[protocol.main] !== 'function') {
        return false;
    }

    if (typeof module[protocol.id] !== 'string' || !module[protocol.id].length) {
        return false;
    }

    if (typeof module[protocol.orderBy] !== 'number' || module[protocol.orderBy] < 0) {
        return false;
    }

    for (var key in protocol.contract) {
        if (protocol.contract.hasOwnProperty(key)) {
            if (typeof module[key] !== protocol.contract[key]) {
                return false;
            }
        }
    }

    return true;
}



/*!
 * Module exports.
 */
module.exports = exports = Plugger;