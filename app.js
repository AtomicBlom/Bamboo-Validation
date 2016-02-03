process.on('unhandledRejection', function (err) {
    console.error(err.stack)
})

require('babel-core/register')
require('./Clover-Coverage-Enforcer.js')
