var TeamCityFormatter = function(options) {
  var util = require('util');
  var Cucumber = require('../../cucumber');
  var _ = require('underscore');
  if (!options) {
    options = {};
  }
  var TEST_IGNORED = '##teamcity[testIgnored name=\'%s\' message=\'PENDING\']';
  var SUITE_START    = '##teamcity[testSuiteStarted name=\'%s\']';
  var SUITE_END       = '##teamcity[testSuiteFinished name=\'%s\']';
  var TEST_START     = '##teamcity[testStarted name=\'%s\']';
  var TEST_FAILED    = '##teamcity[testFailed name=\'%s\' message=\'FAILED\']';
  var TEST_END        = '##teamcity[testFinished name=\'%s\' duration=\'%s\']';

  var self = Cucumber.Listener.Formatter(options);
  var summaryFormatter = Cucumber.Listener.SummaryFormatter({
    coffeeScriptSnippets: options.coffeeScriptSnippets,
    logToConsole: true
  });

  var parentHear = self.hear;
  self.hear = function hear(event, callback) {
    summaryFormatter.hear(event, function () {
      parentHear(event, callback);
    });
  };

  var featureNames = [];

  self.handleBeforeStepEvent = function handleBeforeStepEvent(event, callback) {
    callback();
  };

  self.handleAfterStepEvent = function handleAfterStepEvent(event, callback) {
    callback();
  };

  self.handleBeforeFeatureEvent = function handleBeforeFeatureEvent(event, callback) {
    var feature = event.getPayloadItem('feature');
    featureNames.push(feature.getName());
    self.log(formatString(SUITE_START, feature.getName()));
    callback();
  };

  self.handleAfterFeatureEvent = function handleAfterFeaturesEvent(event, callback) {
    var featureName = featureNames.pop();
    self.log(formatString(SUITE_END, featureName));
    callback();
  };

  self.handleBeforeScenarioEvent = function handleBeforeScenarioEvent(event, callback) {
    var scenario = event.getPayloadItem('scenario');
    self.log(formatString(TEST_START, 'Scenario: ' + scenario.getName()));
    callback();
  };

  self.handleAfterScenarioEvent = function handleAfterScenarioEvent(event, callback) {
    var scenario = event.getPayloadItem('scenario');
    self.log(formatString(TEST_END, 'Scenario: ' + scenario.getName()));
    callback();
  };

  self.handleStepResultEvent = function handleStepResult(event, callback) {
    var stepResult = event.getPayloadItem('stepResult');
    var step = stepResult.getStep();
    var stepName = step.getKeyword() + step.getName();
    if (stepResult.isSuccessful()) {
      /*jshint noempty:false*/
      // Do nothing - ending the test without an error indicates success.
    }
    else if (stepResult.isPending()) {
      self.log(formatString(TEST_IGNORED, step.getName()));
    }
    else if (stepResult.isSkipped()) {
      self.log(formatString(TEST_IGNORED, stepName));
    }
    else if (stepResult.isUndefined()) {
      self.log(formatString(TEST_FAILED, stepName));
    }
    else {
      var failure = stepResult.getFailureException();
      var failureDescription = failure.stack || failure;
      // fix selenium-webdriver error message
      failureDescription = failureDescription.replace(/\n*\s*at <anonymous>/g,'');
      failedTestMessage = '##teamcity[testFailed name=\'%s\' message=\'FAILED\' details=\''+ escapeTeamcityString(failureDescription) +'\']';
      self.log(formatString(failedTestMessage, stepName));
    }
    callback();
  };

  function formatString() {
    var formattedArguments = [];
    var args = Array.prototype.slice.call(arguments, 0);
    // Format all arguments for TC display (it escapes using the pipe char).
    var tcCommand = args.shift();
    _.each(args, function(param) {
      formattedArguments.push(escapeTeamcityString(param));
    });
    formattedArguments.unshift(tcCommand);
    return util.format.apply(util, formattedArguments) + '\n';
  }

  function escapeTeamcityString(message) {
    if(!message) {
        return "";
    }

    return message.replace(/\|/g, "||")
                  .replace(/\'/g, "|'")
                  .replace(/\n/g, "|n")
                  .replace(/\r/g, "|r")
                  .replace(/\u0085/g, "|x")
                  .replace(/\u2028/g, "|l")
                  .replace(/\u2029/g, "|p")
                  .replace(/\[/g, "|[")
                  .replace(/]/g, "|]");
  }

  return self;
};
module.exports = TeamCityFormatter;