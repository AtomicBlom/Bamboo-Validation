import commandLineArgs from 'command-line-args';

var cli = commandLineArgs([
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'src', type: String, multiple: true, defaultOption: true },
    { name: 'timeout', alias: 't', type: Number }
]);


