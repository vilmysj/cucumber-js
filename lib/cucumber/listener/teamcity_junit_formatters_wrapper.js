var TeamCityJunitFormattersWrapper = function(options) {
  var Cucumber = require('../../cucumber'),
      teamCityFormatter = require('./teamcity_formatter')(options),
      junitFormatter = require('./junit_formatter')(options);

  if (!options) {
    options = {};
  }

  var self = Cucumber.Listener.Formatter(options);

  self.hear = function hear(event, callback) {
    teamCityFormatter.hear(event, function() {
      junitFormatter.hear(event, function() {
        callback();
      });
    });
  };

  self.handleBeforeStepEvent = function handleBeforeStepEvent(event, callback) {
    teamCityFormatter.handleBeforeStepEvent(event, function() {
      junitFormatter.handleBeforeStepEvent(event, function() {
        callback();
      });
    });
  };

  self.handleAfterStepEvent = function handleAfterStepEvent(event, callback) {
    teamCityFormatter.handleAfterStepEvent(event, function() {
      junitFormatter.handleAfterStepEvent(event, function() {
        callback();
      });
    });
  };

  self.handleBeforeFeatureEvent = function handleBeforeFeatureEvent(event, callback) {
    teamCityFormatter.handleBeforeFeatureEvent(event, function() {
      junitFormatter.handleBeforeFeatureEvent(event, function() {
        callback();
      });
    });
  };

  self.handleAfterFeatureEvent = function handleAfterFeaturesEvent(event, callback) {
    teamCityFormatter.handleAfterFeatureEvent(event, function() {
      junitFormatter.handleAfterFeatureEvent(event, function() {
        callback();
      });
    });
  };

  self.handleBeforeScenarioEvent = function handleBeforeScenarioEvent(event, callback) {
    teamCityFormatter.handleBeforeScenarioEvent(event, function() {
      junitFormatter.handleBeforeScenarioEvent(event, function() {
        callback();
      });
    });
  };

  self.handleAfterScenarioEvent = function handleAfterScenarioEvent(event, callback) {
    teamCityFormatter.handleAfterScenarioEvent(event, function() {
      junitFormatter.handleAfterScenarioEvent(event, function() {
        callback();
      });
    });
  };

  self.handleStepResultEvent = function handleStepResult(event, callback) {
    teamCityFormatter.handleStepResultEvent(event, function() {
      junitFormatter.handleStepResultEvent(event, function() {
        callback();
      });
    });
  };

  return self;
};
module.exports = TeamCityJunitFormattersWrapper;