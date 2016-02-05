import commandLineArgs from 'command-line-args';
import xpath from 'xpath';
import {DOMParser} from 'xmldom';
import fs from 'fs';
import util from 'util';

var cli = commandLineArgs([
    { name: 'input', type: String, defaultOption: true},
    { name: 'conditional', alias: 'c', type: Number },
    { name: 'statement', alias: 's', type: Number},
    { name: 'method', alias: 'm', type: Number}
]);

var options = cli.parse();
if (options.input === undefined || options.input == "") {
    console.error("No input file specified");
    console.log(cli.getUsage());
    process.exit(-1);
}

options.conditional = options.conditional || process.env.BAMBOO_CONDITIONAL_REQUIREMENT;
options.method = options.method || process.env.BAMBOO_METHOD_REQUIREMENT;
options.statement = options.statement || process.env.BAMBOO_STATEMENT_REQUIREMENT;

if (options.conditional === undefined && options.method === undefined && options.statement === undefined) {
    console.error("No coverage requirements specified.");
    console.log(cli.getUsage());
    process.exit(-1);
}

var content;
fs.readFile(options.input, 'utf8', (err, data) => {
    if (err) {
        throw err;
    }

    var doc = new DOMParser().parseFromString(data);
    var projectMetrics = xpath.select("/coverage/project/metrics", doc)[0];
    var totalStatements = projectMetrics.getAttribute("statements");
    var coveredStatements = projectMetrics.getAttribute("coveredstatements");
    var totalConditionals = projectMetrics.getAttribute("conditionals");
    var coveredConditionals = projectMetrics.getAttribute("coveredconditionals");
    var totalMethods = projectMetrics.getAttribute("methods");
    var coveredMethods = projectMetrics.getAttribute("coveredmethods");

    var passed = true;

    if (options.conditional !== undefined) {
        var percentageCovered = (coveredConditionals / totalConditionals) * 100;
        if (percentageCovered < options.conditional) {
            passed = false;
            console.error("Failed Conditional coverage. %d/%d (%d%%) covered. Required %d%%", coveredConditionals, totalConditionals, percentageCovered, options.conditional);
        }
    }
    if (options.statement !== undefined) {
        var percentageCovered = (coveredStatements / totalStatements) * 100;
        if (percentageCovered < options.statement) {
            passed = false;
            console.error("Failed Statement coverage. %d/%d (%d%%) covered. Required %d%%", coveredStatements, totalStatements, percentageCovered, options.statement);
        }
    }
    if (options.method !== undefined) {
        var percentageCovered = (coveredMethods / totalMethods) * 100;
        if (percentageCovered < options.method) {
            passed = false;
            console.error("Failed Method coverage. %d/%d (%d%%) covered. Required %d%%", coveredMethods, totalMethods, percentageCovered, options.method);
        }
    }

    if (passed) {
        console.info("Code coverage passed.");
        process.exit(0);
    } else {
        console.info("Code coverage failed.");
        process.exit(-1);
    }


});
