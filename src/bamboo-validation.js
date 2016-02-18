
import fs from 'fs';
import util from 'util';
import optionator from 'optionator';
import CloverCoverage from './validators/clover.js'
import {EXIT_CODE_PASSED, EXIT_CODE_FAILED, EXIT_CODE_BAD_ARGUMENTS} from '.'

let validatorFactories = [new CloverCoverage()];
let optionList = [];
for (let validatorFactory of validatorFactories){
    optionList = optionList.concat(validatorFactory.getOptionConfiguration());
}

let options = optionator({
    options: optionList.concat([{
        option: "setErrorCodeOnFail",
        alias: "fail",
        type: "Boolean",
        description: "Sets the error code, causing a bamboo task to fail if conditions are not met.",
        dependsOn: "clover"
    },{
        option: "propertiesFile",
        alias: "output",
        type: "String",
        description: "The .properties file to write",
        required: true
    }])
});

let programArgs = options.parseArgv(process.argv);
if (programArgs.propertiesFile === undefined || programArgs.propertiesFile == "") {
    console.log(options.generateHelp());
    process.exit(EXIT_CODE_BAD_ARGUMENTS);
}

let validatorSelected = false;
const propertiesFile = {};
let finalExitCode = EXIT_CODE_PASSED;
for (let validatorFactory of validatorFactories) {
    let validator = validatorFactory.buildValidator(programArgs);
    if (validator.isSelected()) {
        validatorSelected = true;
        [properties, exitCode] = validator.act();
        if (exitCode == EXIT_CODE_BAD_ARGUMENTS) {
            console.log(options.generateHelp());
            process.exit(exitCode);
        }
        finalExitCode = Math.min(finalExitCode, exitCode);
        Object.assign(propertiesFile, properties);
    }
}

if (!validatorSelected) {
    console.error("No validators have been run.");
    console.log(options.generateHelp());
    process.exit(EXIT_CODE_BAD_ARGUMENTS);
}

let propertiesFileText = "";
for (let [key, value] in propertiesFile) {
    propertiesFileText += key + "=" + value;
}

fs.writeFileSync(programArgs.propertiesFile, propertiesFileText);
if (finalExitCode == EXIT_CODE_PASSED) {
    console.log("Validation passed");
}
process.exit(finalExitCode);