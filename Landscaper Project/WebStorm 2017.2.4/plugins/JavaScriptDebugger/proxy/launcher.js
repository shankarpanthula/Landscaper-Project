"use strict";
var appWorker_1 = require("./appWorker");
var scriptImporter_1 = require("./scriptImporter");
var log_1 = require("./log/log");
var argvSliced = process.argv.slice(2);
var argvMap = {};
argvSliced.forEach(function (a) {
    var _a = a.toString().split("="), k = _a[0], v = _a[1];
    if (v) {
        argvMap[k] = v;
    }
});
var packagerPort = Number(argvMap["--port"]);
if (!packagerPort)
    throw new Error("--port is not specified");
var sourcesStoragePath = argvMap["--sourcesStoragePath"]; //"/home/k/tmp/ssp";
if (!packagerPort)
    throw new Error("--sourcesStoragePath is not specified");
var debugAdapterPort = -1; // unused now
var scriptImporter = new scriptImporter_1.ScriptImporter(packagerPort, sourcesStoragePath);
scriptImporter.downloadDebuggerWorker(sourcesStoragePath).then(function () {
    log_1.Log.logMessage("Downloaded debuggerWorker.js (Logic to run the React Native app) from the Packager.");
}).then(function () {
    log_1.Log.logMessage("Starting debugger app worker.");
    return new appWorker_1.MultipleLifetimesAppWorker(packagerPort, sourcesStoragePath, debugAdapterPort).start();
}).then(function () {
    return log_1.Log.logMessage("Debugging session started successfully.");
});
