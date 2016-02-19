import fs from 'fs';
import xpath from 'xpath';
import {DOMParser} from 'xmldom';
import exitCodes from '../exitcodes'
import util from 'util'
import stringFormat from 'string-format-js'

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
            exitCode: exitCodes.EXIT_CODE_PASSED
        };

        if (this.conditional === undefined && this.method === undefined && this.statement === undefined) {
            console.error("No coverage requirements specified.");
            results.exitCode = exitCodes.EXIT_CODE_BAD_ARGUMENTS;
            console.log("Exiting");
            return results;
        }

        let data = fs.readFileSync(this.cloverFile, 'utf8');

        let doc = new DOMParser().parseFromString(data);
        let projectMetrics = xpath.select("/coverage/project/metrics", doc)[0];
        let totalStatements = projectMetrics.getAttribute("statements");
        let coveredStatements = projectMetrics.getAttribute("coveredstatements");
        let totalConditionals = projectMetrics.getAttribute("conditionals");
        let coveredConditionals = projectMetrics.getAttribute("coveredconditionals");
        let totalMethods = projectMetrics.getAttribute("methods");
        let coveredMethods = projectMetrics.getAttribute("coveredmethods");

        let passed = true;
        let percentageCovered;

        percentageCovered = (coveredConditionals / totalConditionals) * 100;
        results.properties.CLOVER_CONDITIONALS_RESULT = "Conditional coverage %d/%d (%.2f%) covered".format(coveredConditionals, totalConditionals, percentageCovered);
        if (this.conditional !== undefined) {
            results.properties.CLOVER_CONDITIONALS_RESULT += ", required %d%".format(this.conditional);
            results.properties.CLOVER_CONDITIONALS_ENABLED = true;

            if (percentageCovered < this.conditional) {
                passed = false;
                console.error(results.properties.CLOVER_CONDITIONALS_RESULT);
            }
        }

        percentageCovered = (coveredStatements / totalStatements) * 100;
        results.properties.CLOVER_STATEMENTS_RESULT = "Statement coverage %d/%d (%.2f%) covered".format(coveredStatements, totalStatements, percentageCovered);
        if (this.statement !== undefined) {
            results.properties.CLOVER_STATEMENTS_RESULT += ", required %d%".format(this.statement);
            results.properties.CLOVER_STATEMENTS_ENABLED = true;

            if (percentageCovered < this.statement) {
                passed = false;
                console.error(results.properties.CLOVER_STATEMENTS_RESULT);
            }
        }

        percentageCovered = (coveredMethods / totalMethods) * 100;
        results.properties.CLOVER_METHODS_RESULT = "Method coverage %d/%d (%.2f%) covered".format(coveredMethods, totalMethods, percentageCovered);
        if (this.method !== undefined) {
            results.properties.CLOVER_METHODS_RESULT += ", required %d%".format(this.method);
            results.properties.CLOVER_METHODS_ENABLED = true;

            if (percentageCovered < this.method) {
                passed = false;
                console.error(results.properties.CLOVER_METHODS_RESULT);
            }
        }

        results.properties.CLOVER_PASSED = passed;

        if (passed) {
            console.info("Code coverage passed.");
        } else {
            console.info("Code coverage failed.");
            results.exitCode = exitCodes.EXIT_CODE_FAILED;
        }
        return results;
    }
}