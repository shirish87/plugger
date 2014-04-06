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


var loadModules = module.exports.loadModules = function loadModules(dirPath, depth, callback) {
    dirPath = path.resolve(dirPath);
    depth--;

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
            if (/(.*)\.(js|coffee)/.test(file)) {
                callback(null, require(newPath), newPath);
            }
        } else if (stat.isDirectory() && depth > 0) {
            loadModules(newPath, depth, callback);
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
