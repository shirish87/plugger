var Hooker = require('hooker')
  , utils = require('./utils')
  , debug = require('debug')('plugger')
  ;


'use strict';


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
};


/**
 * Filter to be used for detecting plugin files
*/
function defaultFilter(filename) {
    return (/.*\.(js|coffee)$/).test(filename);
}


/**
 * Cache
 */
var slice = Array.prototype.slice;



/**
 * Plugger that plugs the plugins
 * @param modules       Array with each item containing 'path' and 'depth' properties
 * @param options       options including 'protocol' to be followed by all plugin files
 * @param callback      Notifies of invocation errors or completion of all invocations
 * @returns {Plugger}
 * @constructor
 */
function Plugger(modules, options, callback) {
    if (!(this instanceof Plugger)) {
        return new Plugger(modules, options, callback);
    }

    if (arguments.length === 2 && typeof options === 'function') {
        callback = options;
        options = null;
    }

    options = options || {};

    var plugins = []
      , self = this
      , opts
      , fnCheckModule
      ;

    this._protocol = options.protocol || DEF_PROTOCOL;
    this._plugins = [];

    this._hooker = new Hooker(function (err) {
        callback(err);
    });

    // expose hooker methods
    [ 'hook', 'invoke', 'seal' ].forEach(function (fn) {
        self[fn] = self._hooker[fn].bind(self._hooker);
    });

    fnCheckModule = function (err, module, path) {
        if (err) {
            console.warn('Error loading plugin: ' + err + ' | ' + path);
            return;
        }

        if (module) {
            if (self._isValidModule(module)) {
                debug('Loaded plugin: ' + module[self._protocol.id]);
                plugins.push(module);
            } else {
                console.warn('Unrecognized plugin protocol: ' + path);
            }
        }
    };

    // scan for plugins
    modules.forEach(function (module) {
        opts = {};
        opts.filter = (typeof module.filter === 'function')
            ? module.filter
            : defaultFilter;

        utils.loadModules(module.path, module.depth || 1, opts, fnCheckModule);
    });


    this._plugins = (typeof options.filter === 'function')
        ? plugins.filter(options.filter)
        : plugins;

    this._plugins.sort(function (a, b) {
        return a[self._protocol.orderBy] - b[self._protocol.orderBy];
    });

    return this;
}


/**
 * Initializes all detected plugins by calling the protocol.main 
 * function in the order of protocol.orderBy
 * Plugins are expected to register their hooks in protocol.main
 */
Plugger.prototype.init = function () {
    debug('init');

    var plugins = this._plugins
      , protocol = this._protocol
      , args
      , plugin
      ;

    if (!protocol.main) {
        return;
    }

    args = slice.call(arguments);
    args.unshift(this._hooker);
    args.unshift(this.hook);

    for (var i = 0, l = plugins.length; i < l; i++) {
        plugin = plugins[i];
        debug('initializing plugin: ' + plugin[protocol.id]);
        plugin[protocol.main].apply(plugin, args);
    }
};


/**
 * Retrieve the require'd plugin module by protocol.id
 * @param idValue
 * @returns {*}
 */
Plugger.prototype.getPlugin = function (idValue) {
    var plugins = this._plugins
      , id = this._protocol.id
      ;

    for (var i = 0, l = plugins.length; i < l; i++) {
        if (plugins[i][id] === idValue) {
            return plugins[i];
        }
    }

    return false;
};


/**
 * Executes callback once for each detected plugin
 * @param callback
 */
Plugger.prototype.forEach = function (callback) {
    this._plugins.forEach(callback);
};

/**
 * List plugins
 */
Plugger.prototype.debug = function () {
    var self = this;

    console.log("\n");
    console.log('---------------');
    this.forEach(function (plugin) {
        console.log('[PLUGIN] ' + plugin[self._protocol.id] + ' | ' + plugin[self._protocol.orderBy]);
    });
    console.log('---------------');
    console.log("\n");
}


/**
 * Checks if require'd module follows the specified protocol, i.e. module is a plugin
 * @param module        require'd module
 * @returns {boolean}
 * @private
 */
Plugger.prototype._isValidModule = function (module) {
    var protocol = this._protocol;

    if (protocol.main && typeof module[protocol.main] !== 'function') {
        debug('missing main');
        return false;
    }

    if (typeof module[protocol.id] !== 'string' || !module[protocol.id].length) {
        debug('missing id');
        return false;
    }

    if (typeof module[protocol.orderBy] !== 'number' || module[protocol.orderBy] < 0) {
        debug('missing orderBy');
        return false;
    }

    if (protocol.contract) {
        for (var key in protocol.contract) {
            if (protocol.contract.hasOwnProperty(key)) {
                if (typeof module[key] !== protocol.contract[key]) {
                    debug('failed contract');
                    return false;
                }
            }
        }
    }

    return true;
};



/*!
 * Module exports.
 */
module.exports = exports = Plugger;