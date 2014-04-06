var Hooker = require('hooker')
  , path = require('path')
  , utils = require('./utils')
  , debug = require('debug')('plugger')


/*
 Every plugin must contain an init, priority, name
 */

var DEF_OPTIONS = {
    init: 'init'
  , priority: 'priority'
  , name: 'name'
};


var slice = Array.prototype.slice;



function Plugger(modules, options, callback) {
    if (!(this instanceof Plugger)) return new Plugger(modules, options, callback);

    if (arguments.length === 2 && typeof options === 'function') {
        callback = options;
        options = null;
    }

    this._options = options || DEF_OPTIONS;
    this._plugins = [];

    this._hooker = new Hooker(function (err) {
        if (err) {
            callback(err);
        }
    });

    this.hook = this._hooker.hook.bind(this._hooker);
    this.invoke = this._hooker.invoke.bind(this._hooker);


    var self = this;

    for (var i = 0, l = modules.length; i < l; i++) {
        var module = modules[i];
        utils.loadModules(module.path, module.depth || 1, function (err, module) {
            if (!err && module) {
                if (self._isValidModule(module)) {
                    self._plugins.push(module);
                }
            }
        });
    }


    this._plugins.sort(function (a, b) {
        return a.priority - b.priority;
    });
}


Plugger.prototype.init = function () {
    var plugins = this._plugins;
    var options = this._options;

    var args = slice.call(arguments);
    args.unshift(this._hooker);
    args.unshift(this.hook);

    for (var i = 0, l = plugins.length; i < l; i++) {
        var plugin = plugins[i];
        plugin[options.init].apply(plugin, args);
    }
}


Plugger.prototype.getPlugin = function (name) {
    var plugins = this._plugins;
    var options = this._options;

    for (var i = 0, l = plugins.length; i < l; i++) {
        if (plugins[i][options.name] === name) {
            return plugins[i];
        }
    }

    return false;
}



Plugger.prototype._isValidModule = function (module) {
    var options = this._options;

    if (typeof module[options.init] !== 'function') {
        return false;
    }

    if (typeof module[options.name] !== 'string' || !module[options.name].length) {
        return false;
    }

    if (typeof module[options.priority] !== 'number' || module[options.priority] < 0) {
        return false;
    }

    return true;
}



/*!
 * Module exports.
 */
module.exports = exports = Plugger;