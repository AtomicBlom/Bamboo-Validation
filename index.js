process.on('unhandledRejection', function (err) {
    console.error(err.stack)
})

require('./lib/Clover-Coverage-Enforcer.js')
