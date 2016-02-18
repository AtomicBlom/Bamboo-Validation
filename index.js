process.on('unhandledRejection', function (err) {
    console.error(err.stack)
})

require('./lib/bamboo-validation.js')
