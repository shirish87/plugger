
var Plugger = require('../index')
  , path = require('path')


describe("Functionality", function () {
    // TODO: More tests

    it("Loads plugin directory", function (done) {
        var plugger = new Plugger([ { path: path.resolve('./test/plugins') }], function (err) {
            console.log('done', err);
        });

        plugger.init();
        plugger.invoke('event1');
        plugger.invoke('event2');

        var plugin1 = plugger.getPlugin('plugin1');
        if (!plugin1) {
            done('failed to get plugin');
        } else {
            done();
        }
    });

});