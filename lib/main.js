

var Class = require('better-js-class');
var cps = require('cps');
var poolModule = require('generic-pool');


module.exports = function() {
    var Pool = Class({
        _init: function(cfg) {
            this._pool = poolModule.Pool({
                name: 'generic-iterator',
                create: function(cb) {
                    var processor = new cfg.ProcessorClass();
                    cb(null, processor);
                },
                destroy: function(processor) {
                    processor.destroy()
                },
                max: cfg.max
            });

            this._max = cfg.max;
            this._avaiable = cfg.max;
        },

        acquire: function(cb) {
            var me = this;

            cps.seq([
                function(_, cb) {
                    me._pool.acquire(cb);
                },
                function(processor, cb) {
                    me._avaiable--;
                    cb(null, processor);
                }
            ], cb);
        },

        release: function(processor) {
            var me = this;

            me._pool.release(processor);
            me._avaiable++;

            if (me._avaiable == me._max && me._exitCB) {
                me._exitCB();
            }
        },

        onDrain: function(cb) {
            var me = this;

            me._exitCB = function() {
                me._pool.destroyAllNow();
                cb();
            };

            if (me._avaiable == me._max) {
                me._exitCB();
            }
        }
    });

    var Iterator = Class({
        _init: function(cfg) {
            this._pool = new Pool({
                max: cfg.max,
                ProcessorClass: cfg.ProcessorClass
            });
        },

        _traverse: function(proc, cb) {
            throw 'Iterator._traverse must be overridden.';
        },

        _runProcessor: function(processor, entry, cb) {
            var me = this;

            var cb = function(err, res) {

            };

            cps.seq([
                function(_, cb) {
                    processor.process(entry, cb);
                },
                function(_, cb) {
                    me._pool.release(processor);
                    cb();
                }
            ], cb);
        },

        run: function(cb) {
            var me = this;

            cps.seq([
                function(_, cb) {
                    me._traverse(function(entry, cb) {
                        console.log(entry);
                        cps.seq([
                            function(_, cb) {
                                me._pool.acquire(cb);
                            },
                            function(processor, cb) {
                                cb();
                                me._runProcessor(processor, entry, cb);
                            }
                        ], cb)
                    }, cb);
                },
                function(_, cb) {
                    console.log('call on drain');
                    me._pool.onDrain(cb);
                }
            ], cb);
        }
    });

    return Iterator;
}();