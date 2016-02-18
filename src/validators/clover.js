import fs from 'fs';
import {EXIT_CODE_PASSED, EXIT_CODE_FAILED, EXIT_CODE_BAD_ARGUMENTS} from '../constants'

export default class {
    getOptionConfiguration() {
        return [{
            option: "clover",
            type: "String",
            description: "Coverage will be analysed"
        },{
            option: "cloverStatements",
            alias: "clover.statements",
            type: "Int",
            description: "the percentage coverage expected on Statements",
            example: "cloverStatements=56"
        },{
            option: "cloverMethods",
            alias: "clover.methods",
            type: "Int",
            description: "the percentage coverage expected on Methods, e.g. 56%",
            dependsOn: "clover"
        },{
            option: "cloverConditionals",
            alias: "clover.conditionals",
            type: "Int",
            description: "the percentage coverage expected on Conditional branches, e.g. 56%",
            dependsOn: "clover"
        }];
    }

    buildValidator(options) {
        return new CloverValidator(options);
    }
}

class CloverValidator {
    /*var cloverFile;
    var conditional;
    var method;
    va1*r statement;*/

    constructor(options) {
        this.cloverFile = options.clover;
        this.conditional = options.cloverConditionals || process.env.BAMBOO_CONDITIONAL_REQUIREMENT;
        this.method = options.cloverMethods || process.env.BAMBOO_METHOD_REQUIREMENT;
        this.statement = options.cloverStatements || process.env.BAMBOO_STATEMENT_REQUIREMENT;
    }

    isSelected() {
        return (this.cloverFile !== undefined && this.cloverFile != "");
    }

    act() {
        let results = {
            properties: {
                CLOVER_PASSED: true,
                CLOVER_CONDITIONALS_ENABLED: false,
                CLOVER_CONDITIONALS_RESULT: "(0/0) 0%",
                CLOVER_METHODS_ENABLED: false,
                CLOVER_METHODS_RESULT: "(0/0) 0%",
                CLOVER_STATEMENTS_ENABLED: false,
                CLOVER_STATEMENTS_RESULT: "(0/0) 0%"
            },
            exitCode: EXIT_CODE_PASSED
        };

        if (this.conditional === undefined && this.method === undefined && this.statement === undefined) {
            console.error("No coverage requirements specified.");
            results.exitCode = EXIT_CODE_BAD_ARGUMENTS;
            return results;
        }

        let data = fs.readFileSync(options.input, 'utf8');

        let doc = new DOMParser().parseFromString(data);
        let projectMetrics = xpath.select("/coverage/project/metrics", doc)[0];
        let totalStatements = projectMetrics.getAttribute("statements");
        let coveredStatements = projectMetrics.getAttribute("coveredstatements");
        let totalConditionals = projectMetrics.getAttribute("conditionals");
        let coveredConditionals = projectMetrics.getAttribute("coveredconditionals");
        let totalMethods = projectMetrics.getAttribute("methods");
        let coveredMethods = projectMetrics.getAttribute("coveredmethods");

        let passed = true;

        if (options.conditional !== undefined) {
            let percentageCovered = (coveredConditionals / totalConditionals) * 100;
            if (percentageCovered < options.conditional) {
                passed = false;
                results.properties.CLOVER_CONDITIONALS_RESULT = util.format("Failed Conditional coverage. %d/%d (%d%%) covered. Required %d%%", coveredConditionals, totalConditionals, percentageCovered, options.conditional);
                console.error(results.properties.CLOVER_CONDITIONALS_RESULT);
            }
        }
        if (options.statement !== undefined) {
            let percentageCovered = (coveredStatements / totalStatements) * 100;
            if (percentageCovered < options.statement) {
                passed = false;
                results.properties.CLOVER_STATEMENTS_RESULT = util.format("Failed Statement coverage. %d/%d (%d%%) covered. Required %d%%", coveredStatements, totalStatements, percentageCovered, options.statement);
                console.error(results.properties.CLOVER_STATEMENTS_RESULT);
            }
        }
        if (options.method !== undefined) {
            let percentageCovered = (coveredMethods / totalMethods) * 100;
            if (percentageCovered < options.method) {
                passed = false;
                results.properties.CLOVER_STATEMENTS_RESULT = util.format("Failed Method coverage. %d/%d (%d%%) covered. Required %d%%", coveredMethods, totalMethods, percentageCovered, options.method);
                console.error(results.properties.CLOVER_STATEMENTS_RESULT);
            }
        }

        results.properties["CLOVER_PASSED"] = passed;

        if (passed) {
            console.info("Code coverage passed.");
        } else {
            console.info("Code coverage failed.");
            results.exitCode = EXIT_CODE_FAILED;
        }
    }
}