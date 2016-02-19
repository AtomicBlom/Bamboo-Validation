
import fs from 'fs';
import util from 'util';
import optionator from 'optionator';
import CloverCoverage from './validators/clover.js'
import exitcodes from './exitcodes'

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
    process.exit(exitcodes.EXIT_CODE_BAD_ARGUMENTS);
}

let validatorSelected = false;
const propertiesFile = {};
let finalExitCode = exitcodes.EXIT_CODE_PASSED;
for (let validatorFactory of validatorFactories) {
    let validator = validatorFactory.buildValidator(programArgs);
    if (validator.isSelected()) {
        validatorSelected = true;
        let result = validator.act();
        console.log("validator returned " + result.exitCode);
        if (result.exitCode == exitcodes.EXIT_CODE_BAD_ARGUMENTS) {
            console.log(options.generateHelp());
            process.exit(result.exitCode);
        }
        finalExitCode = Math.min(finalExitCode, result.exitCode);
        Object.assign(propertiesFile, result.properties);
    }
}

if (!validatorSelected) {
    console.error("No validators have been run.");
    console.log(options.generateHelp());
    process.exit(exitcodes.EXIT_CODE_BAD_ARGUMENTS);
}

console.log(propertiesFile);

let propertiesFileText = "";
for (let key in propertiesFile) {
    propertiesFileText += key + "=" + propertiesFile[key] + "\r\n";
}

fs.writeFileSync(programArgs.propertiesFile, propertiesFileText);
if (finalExitCode == exitcodes.EXIT_CODE_PASSED) {
    console.log("Validation passed");
}
process.exit(finalExitCode);