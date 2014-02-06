generic-iterator
================

Example:

```js
var Class = require('better-js-class');
var cps = require('cps');
var Iterator = require('generic-iterator');

var cb = function(err, res) {
    if(err) {
        console.log('ERROR:', err);
        if (err.stack) {
            console.log(err.stack);
        }
    } else {
        console.log('OK:', res);
    }

};

var Processor = Class({
    process: function(entry, cb) {
        console.log('start processing', entry);
        setTimeout(function() {
            console.log('finish processing', entry);
            cb();
        }, 1000);
    },

    destroy: function() {

    }
});

var MyIterator = Class(Iterator, {
    _init: function() {
        this.parent._init.call(this, {
            max: 1,
            ProcessorClass: Processor
        });
    },

    _traverse: function(proc, cb) {
        cps.pfor(100, function(i, cb) {
            proc(i, cb);
        }, cb);
    }
});

(function() {
    var startTime;

    cps.seq([
        function(_, cb) {
            startTime = new Date();
            cb();
        },
        function(_, cb) {
            var myIterator = new MyIterator();
            myIterator.run(cb);
        },
        function(_, cb) {
            var endTime = new Date();
            cb(null, endTime - startTime);
        }
    ], cb);
})();
```
