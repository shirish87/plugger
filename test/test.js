
var Plugger = require('../index')
  , path = require('path')


describe("Functionality", function () {
    // TODO: More tests

    it("Loads plugins", function (done) {
        var plugger = new Plugger([ { path: path.resolve('./test/plugins') }], function (err) {
            done(err);
        });

        plugger.init();
        plugger.invoke('event1');
        plugger.invoke('event2');
        plugger.invoke('event3');
    });


    it("Retrieves plugin by id", function (done) {
        var plugger = new Plugger([ { path: path.resolve('./test/plugins') }], function (err) {
            console.log('done', err);
        });

        plugger.init();

        var plugin1 = plugger.getPlugin('plugin1');
        if (!plugin1) {
            done('failed to get plugin');
        } else {
            done();
        }
    });

});