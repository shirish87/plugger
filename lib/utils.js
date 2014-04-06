/**
 * Created by shirish on 4/11/13.
 */

var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , debug = require('debug')('utils')


module.exports.dump = function(name, obj) {
    if (arguments.length == 1) {
        obj = name;
        name = '';
    }
    console.log(name, util.inspect(obj, { depth: null }));
}


var loadModules = module.exports.loadModules = function loadModules(dirPath, opts, callback) {
    opts = opts || {};

    if (typeof opts.depth !== 'number') {
        opts.depth = 1;
    }

    if (typeof opts.filter !== 'function') {
        opts.filter = defaultFilter;
    }

    dirPath = path.resolve(dirPath);
    opts.depth--;

    var files;

    try {
        files = fs.readdirSync(dirPath);
    } catch (e) {
        console.log('[ERROR] Skipped reading ' + e.code, dirPath);
    }

    if (!files || !files.length) {
        callback(new Error('failed to load files in: ' + dirPath));
        return;
    }

    files.forEach(function (file) {
        var newPath = path.join(dirPath, file);
        var stat = fs.statSync(newPath);

        if (stat.isFile()) {
            if (opts.filter(file)) {
                callback(null, require(newPath), newPath);
            }
        } else if (stat.isDirectory() && opts.depth > 0) {
            loadModules(newPath, opts, callback);
        }
    });
}


module.exports.moduleExists = function(module) {
    try {
        require.resolve(module);
        return true;
    } catch (e) {
        // ignore
    }

    return false;
}


/**
 * Filter to be used for detecting plugin files
*/
function defaultFilter(filename) {
    return /.*\.(js|coffee)$/.test(filename);
}
