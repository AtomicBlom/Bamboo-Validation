process.on('unhandledRejection', function (err) {
    console.error(err.stack)
});

require('babel-polyfill');
require('./lib/bamboo-validation.js');
