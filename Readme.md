#Overview
Clover-Coverage-Enforcer allows you to cause a build to fail when your coverage does not meet your expectations.

This project was made to help get deeper integration between Bambooo and third party code coverage tools.

The specific use case we had at my work was a NodeJS service which used Mocha and Instanbul to provide unit tests and code coverage. Instanbul can output a Clover compatible coverage report which is perfect for use in Bamboo, but does not exit with an error when code coverage does not meet a given standard.

#Installing
This project does not yet have an NPM module yet as I want to write my own unit tests and abstract the coverage parsing.

In the meantime, install it from my repository using

npm install http://github.com/AtomicBlom/Clover-Coverage-Enforcer.git

#Using the enforcer

you can run the enforcer in bamboo using a 'node' task. I recommend using Node 5.

The command to run will be
node node_modules/Clover-Coverage-Enforcer/bin/coverageEnforcer ./path/to/clover.xml

There are two methods you can use to specify your coverage requirements, either command line parameters, or bamboo's enviroment variables. If both are specified, command line arguments will take preference.

##Command Line Arguments
```
Options

  --input string             File to process
  -c, --conditional number   Percent of Conditional branches covered
  -s, --statement number     Percent of Statements covered 
  -m, --method number        Percent of Methods covered
```

When parameters are combined, a given coverage file must meet all of the prerequisites to pass the build.

```
node node_modules/Clover-Coverage-Enforcer/bin/coverageEnforcer ./path/to/clover.xml --conditional 95 --statements 60
```

In order for this to pass, the clover.xml file must have 95% conditional branches coverage and 65% statements covered.

#Environment variables
It is also possible to use Environment variables in place of command line parameters.

```
BAMBOO_CONDITIONAL_REQUIREMENT
    equivalent to --conditional
BAMBOO_METHOD_REQUIREMENT
    equivalent to --method
BAMBOO_STATEMENT_REQUIREMENT
    equivalent to --statement
```


