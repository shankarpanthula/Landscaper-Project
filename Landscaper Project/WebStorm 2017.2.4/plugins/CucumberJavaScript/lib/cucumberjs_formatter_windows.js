var fs = require('fs');

function log(message) {
  message += "\n";
  fs.writeSync(1, message);
  fs.fsyncSync(1);
}

function JetBrainsSMListener() {
    var currentFeature;
    var lastFailedTestName = null;

    this.StepResult(function handleStepResult(event, callback) {
        var stepResult = getStepResult(event);
        var step = stepResult.getStep();
        var message;

        if (lastFailedTestName != null && lastFailedTestName == step.getName()) {
            callback();
            return;
        }
        lastFailedTestName = null;

        if (stepResult.getStatus() == "skipped" || stepResult.getStatus() == "pending") {
            message = "##teamcity[testIgnored name = 'Step: %s' message = 'Skipped step' timestamp = '%s']\n";
            message = message.replace('%s', step.getName());
            message = message.replace('%s', getCurrentDate());
            log(message);
        } else if (stepResult.getStatus() == "undefined") {
            message = "##teamcity[testFailed timestamp = '%s' details = '' message = 'Undefined step: %s' name = 'Step: %s' error = 'true']\n";
            message = message.replace('%s', getCurrentDate());
            message = message.replace('%s', step.getName());
            message = message.replace('%s', step.getName());
            log(message);
        } else if(stepResult.getStatus() == "failed") {
            lastFailedTestName = step.getName();
            var exception = stepResult.getFailureException();

            var stack = exception.stack != null ? exception.stack.toString() : '';
            stack = stack.replace(/\|/g, "||").replace(/\n/g, "|n").replace(/\r/g, "|r").replace(/'/g, "|'").replace(/\[/g, "|[").replace(/\]/g, "|]");
            message = "##teamcity[testFailed timestamp = '%s' details = '%s' message = '%s' name = 'Step: %s']\n";
            message = message.replace('%s', getCurrentDate());
            message = message.replace('%s', stack);
            message = message.replace('%s', '');
            message = message.replace('%s', step.getName());
            log(message);

            message = "##teamcity[customProgressStatus timestamp='%s' type='testFailed']\n";
            message = message.replace('%s', getCurrentDate());
            log(message);
        }

        message = "##teamcity[testFinished timestamp = '%s' diagnosticInfo = 'cucumber  f/s=(1344855950447, 1344855950447), duration=0, time.now=%s' duration = '%s' name = 'Step: %s']\n";
        time = getCurrentDate();
        message = message.replace('%s', time);
        message = message.replace('%s', time);
        message = message.replace('%s', Math.round(stepResult.getDuration() / 1000000));
        message = message.replace('%s', step.getName());
        log(message);

        callback();
    });

    this.BeforeFeatures(function handleBeforeFeaturesEvent(event, callback) {
        var message = "##teamcity[enteredTheMatrix timestamp = '%s']\n";
        message = message.replace('%s', getCurrentDate());
        log(message);

        message = "##teamcity[customProgressStatus testsCategory = 'Scenarios' count = '0' timestamp = '%s']\n";
        message = message.replace('%s', getCurrentDate());
        log(message);
        callback();
    });

    this.BeforeFeature(function(event, callback) {
        var feature = getFeature(event);
        currentFeature = feature;
        var message = "##teamcity[testSuiteStarted timestamp = '%s' locationHint = 'file:///%s' name = 'Feature: %s']\n";
        message = message.replace('%s', getCurrentDate());
        message = message.replace('%s', feature.getUri() + ':' + feature.getLine());
        message = message.replace('%s', feature.getName());
        log(message);

        callback();
    });

    this.AfterFeature(function handleAfterFeatureEvent(event, callback) {
        var feature = getFeature(event);
        var message = "##teamcity[testSuiteFinished timestamp = '%s' name = 'Feature: %s']\n";
        message = message.replace('%s', getCurrentDate());
        message = message.replace('%s', feature.getName());
        log(message);

        callback();
    });

    this.BeforeStep(function handleBeforeScenarioEvent(event, callback) {
        var step = getStep(event);
        testStarted(step);

        callback();
    });

    this.BeforeScenario(function handleBeforeScenario(event, callback) {
        var scenario = getScenario(event);

        var message = "##teamcity[customProgressStatus type = 'testStarted' timestamp = '%s']\n";
        message = message.replace('%s', getCurrentDate());
        log(message);

        message = "##teamcity[testSuiteStarted timestamp = '%s' locationHint = 'file:///%s' name = 'Scenario: %s']\n";
        message = message.replace('%s', getCurrentDate());
        message = message.replace('%s', scenario.getUri() + ':' + scenario.getLine());
        message = message.replace('%s', scenario.getName());
        log(message);
        callback();
    });

    this.AfterScenario(function handleAfterScenario(event, callback) {
        var scenario = getScenario(event)

        var message = "##teamcity[testSuiteFinished timestamp = '%s' name = 'Scenario: %s']\n";
        message = message.replace('%s', getCurrentDate());
        message = message.replace('%s', scenario.getName());
        log(message);
        callback();
    });

    this.AfterFeatures(function handleAfterFeaturesEvent(event, callback) {
        var message = "##teamcity[customProgressStatus testsCategory = '' count = '0' timestamp = '%s']\n";
        message = message.replace('%s', getCurrentDate());
        log(message);
        callback();
    });

    function getFeature(eventOrFeature) {
        if (eventOrFeature.getUri == null) {
            return eventOrFeature.getPayloadItem('feature')
        }
        return eventOrFeature
    }

    function getScenario(eventOrScenario) {
        if (eventOrScenario.getUri == null) {
            return eventOrScenario.getPayloadItem('scenario')
        }
        return eventOrScenario
    }

    function getStep(eventOrStep) {
        if (eventOrStep.getUri == null) {
            return eventOrStep.getPayloadItem('step')
        }
        return eventOrStep
    }

    function getStepResult(eventOrStepResult) {
        if (eventOrStepResult.getFailureException == null) {
            return eventOrStepResult.getPayloadItem('stepResult')
        }
        return eventOrStepResult
    }

    function adjustToLength(number, length) {
        result = '' + number;
        while (result.length < length) {
            result = '0' + result;
        }
        return result;
    }

    function getCurrentDate() {
        var date = new Date();
        var year = adjustToLength(date.getFullYear(), 4);
        var month = adjustToLength(date.getMonth(), 2);
        var day = adjustToLength(date.getDay(), 2);

        var hours = adjustToLength(date.getHours(), 2);
        var minutes = adjustToLength(date.getMinutes(), 2);
        var seconds = adjustToLength(date.getSeconds(), 2);
        var milliseconds = adjustToLength(date.getMilliseconds(), 3);

        var timezone = Math.abs(date.getTimezoneOffset() / 60 * (-1));
        timezone = adjustToLength(timezone, 2);
        if (date.getTimezoneOffset() > 0) {
            timezone = '-' + timezone;
        } else {
            timezone = '+' + timezone;
        }

        return '' + year + '-' + month + '-' + day + "T" + hours + ':' + minutes + ':' + seconds + '.' + milliseconds + '' + timezone + '00';
    }

    function testStarted(step) {
        var message = "##teamcity[testStarted timestamp = '%s' locationHint = 'file:///%s' captureStandardOutput = 'true' name = 'Step: %s']\n";
        message = message.replace("%s", getCurrentDate());
        message = message.replace("%s", step.getUri() + ':' + step.getLine());
        message = message.replace("%s", step.getName());
        log(message);
    }
}

module.exports = JetBrainsSMListener;
