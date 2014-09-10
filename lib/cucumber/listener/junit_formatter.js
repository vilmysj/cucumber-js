var JunitFormatter = function (options) {
  var Cucumber = require('../../cucumber');
  var builder = require('xmlbuilder');

  var failedStepResults = [];
  var testSuitesStartTime,testSuiteStartTime, testCaseStartTime;
  var testSuites, testSuite, testCase;
  var testSuitesTotalTestCount, testSuiteTotalTestCount;
  var testSuitesErrorTestCount, testSuiteErrorTestCount;
  var testSuitesFailureTestCount, testSuiteFailureTestCount;
  var feature;

  var statsJournal  = Cucumber.Listener.StatsJournal();

  var self = Cucumber.Listener.Formatter(options);

  var parentHear = self.hear;
  self.hear = function hear(event, callback) {
    statsJournal.hear(event, function () {
      parentHear(event, callback);
    });
  };

  self.handleBeforeScenarioEvent = function handleBeforeScenarioEvent(event, callback) {
    testCaseStartTime = self.getTime();
    callback();
  };


  self.handleAfterScenarioEvent = function handleAfterScenarioEvent(event, callback) {
    self.buildTestCase(event, callback);
  };

  self.handleBeforeFeaturesEvent = function handleBeforeFeaturesEvent(event, callback) {
    testSuites = builder.create('testsuites');
    testSuitesStartTime = self.getTime();
    testSuitesTotalTestCount = testSuitesErrorTestCount = testSuitesFailureTestCount = 0;
    callback();
  };

  self.handleAfterFeaturesEvent = function handleAfterFeaturesEvent(event, callback) {
    // update totals
    testSuites.att('time', self.getTimeDiff(testSuitesStartTime, self.getTime()));
    testSuites.att('tests', testSuitesTotalTestCount);
    testSuites.att('errors', testSuitesErrorTestCount);
    testSuites.att('failures', testSuitesFailureTestCount);
    // log result
    self.logXML();
    callback();
  };

  self.handleBeforeFeatureEvent = function handleBeforeFeatureEvent(event, callback) {
    testSuite = testSuites.element('testsuite');
    testSuiteStartTime = self.getTime();
    testSuiteTotalTestCount = testSuiteErrorTestCount = testSuiteFailureTestCount = 0;
    feature  = event.getPayloadItem('feature');
    callback();
  };

  self.handleAfterFeatureEvent = function handleAfterFeatureEvent(event, callback) {
    var feature = event.getPayloadItem('feature');
    testSuite.att('name', feature.getName());
    testSuite.att('time', self.getTimeDiff(testSuiteStartTime, self.getTime()));
    testSuite.att('tests', testSuiteTotalTestCount);
    testSuite.att('errors', testSuiteErrorTestCount);
    testSuite.att('failures', testSuiteFailureTestCount);
    callback();
  };

  self.logXML = function logXML(){
    // log results
    self.log(testSuites.end({ pretty: true }));
  };

  self.handleStepResultEvent = function handleStepResultEvent(event, callback) {
    var stepResult = event.getPayloadItem('stepResult');
    var step = stepResult.getStep();

    if (stepResult.isFailed()) {
      var failure = stepResult.getFailureException();
      var failureDescription = failure.stack || failure;
      // fix selenium-webdriver error message
      failureDescription = failureDescription.replace(/\n*\s*at <anonymous>/g,'');
      failedStepResults.push({
        step: step.getName(),
        failureDescription: failureDescription
      });
    }

    callback();
  };

  self.buildTestCase = function(event, callback){
    var scenario = event.getPayloadItem('scenario');

    var testCase = testSuite.element('testcase');

    // set name
    testCase.att('name', scenario.getName());
    // set classname/feature
    testCase.att('classname', feature.getName());
    // set time
    testCase.att('time', self.getTimeDiff(testCaseStartTime, self.getTime()));

    // increment the total counters
    testSuitesTotalTestCount ++;
    testSuiteTotalTestCount ++;

    var name = scenario.getName();
    var uri  = scenario.getUri();
    var line = scenario.getLine();

    var text = uri + ":" + line + " # Scenario: " + name + "";
    // handle errors
    if(statsJournal.isCurrentScenarioPending() || statsJournal.isCurrentScenarioUndefined()){

      // increment the error counters
      testSuitesErrorTestCount ++;
      testSuiteErrorTestCount ++;

      // create the error element
      testCase.element('error', {message:"Scenario: "+name+" ERROR"}, text);

    // handle failures
    } else if (statsJournal.isCurrentScenarioFailing()) {

      // increment the failure counters
      testSuitesFailureTestCount ++;
      testSuiteFailureTestCount ++;

      var failureText = '\n## FailureDescription: ';
      for (var i = 0; i < failedStepResults.length; i++) {
        failureText += '\nStep: "' + failedStepResults[i].step + '"\nFailed: "' + failedStepResults[i].failureDescription + '"" ';
      };

      // create the failure element
      testCase.element('failure', {message:"Scenario: "+name+" FAILED"}, text + failureText);
    }
    failedStepResults = [];
    callback();

  };

  self.getTime = function getTime(){
    return (new Date).getTime();
  };

  self.getTimeDiff = function getTimeDiff(before, after){
    return (after - before)/1000;
  };

  return self;
};

module.exports = JunitFormatter;
