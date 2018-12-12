"use strict";
/**
 * Entry point for the TypeScript plugin
 */
exports.__esModule = true;
var service_loader_1 = require("./service-loader");
var logger_impl_1 = require("./logger-impl");
var out_path_process_1 = require("./out-path-process");
var ts_session_provider_1 = require("./ts-session-provider");
var ts_session_1 = require("./ts-session");
var compile_info_holder_1 = require("./compile-info-holder");
var ts_default_options_1 = require("./ts-default-options");
var TypeScriptLanguagePlugin = (function () {
    function TypeScriptLanguagePlugin(state) {
        var serviceInfo = service_loader_1.getService(state.serverFolderPath);
        var serviceContext = serviceInfo.context;
        var serverFilePath = serviceInfo.serverFilePath;
        var ts_impl = serviceContext.ts;
        var loggerImpl = logger_impl_1.createLoggerFromEnv(ts_impl);
        this.overrideSysDefaults(ts_impl, state, serverFilePath);
        var defaultOptionsHolder = this.getDefaultCommandLineOptions(state, ts_impl);
        var pathProcessor = null;
        if (state.hasManualParams && state.outPath) {
            pathProcessor = out_path_process_1.getPathProcessor(ts_impl, state);
        }
        var mainFile = null;
        if (state.hasManualParams && state.mainFilePath) {
            mainFile = state.mainFilePath;
        }
        var projectEmittedWithAllFiles = new compile_info_holder_1.HolderContainer();
        this._session = this.getSession(ts_impl, loggerImpl, defaultOptionsHolder, pathProcessor, mainFile, projectEmittedWithAllFiles);
        this.readyMessage = { version: ts_impl.version };
        if (ts_impl.getSupportedCodeFixes) {
            var codes = ts_impl.getSupportedCodeFixes();
            if (codes && codes.length > 0) {
                this.readyMessage.supportedErrorCodes = codes;
            }
        }
    }
    /**
     * if hasManualParams returns '{}' or parsed options
     * {} is a flag for skipping 'Cannot find parent tsconfig.json' notification
     * otherwise returns 'null' or parsed options
     */
    TypeScriptLanguagePlugin.prototype.getDefaultCommandLineOptions = function (state, ts_impl) {
        var commonDefaultCommandLine = state.commandLineArguments && state.commandLineArguments.length > 0 ?
            ts_impl.parseCommandLine(state.commandLineArguments) :
            null;
        var commonDefaultOptions = null;
        if (commonDefaultCommandLine && commonDefaultCommandLine.options) {
            commonDefaultOptions = commonDefaultCommandLine.options;
        }
        if (commonDefaultOptions === null && state.hasManualParams) {
            commonDefaultOptions = {};
        }
        var isUseSingleInferredProject = state.isUseSingleInferredProject;
        return new ts_default_options_1.DefaultOptionsHolder(commonDefaultOptions, ts_impl, state);
    };
    TypeScriptLanguagePlugin.prototype.overrideSysDefaults = function (ts_impl, state, serverFile) {
        var pending = [];
        var canWrite = true;
        function writeMessage(s) {
            if (!canWrite) {
                pending.push(s);
            }
            else {
                canWrite = false;
                process.stdout.write(new Buffer(s, "utf8"), setCanWriteFlagAndWriteMessageIfNecessary);
            }
        }
        function setCanWriteFlagAndWriteMessageIfNecessary() {
            canWrite = true;
            if (pending.length) {
                writeMessage(pending.shift());
            }
        }
        // Override sys.write because fs.writeSync is not reliable on Node 4
        ts_impl.sys.write = function (s) { return writeMessage(s); };
        //ts 2.0 compatibility
        ts_impl.sys.setTimeout = setTimeout;
        ts_impl.sys.clearTimeout = clearTimeout;
        //ts2.0.5 & 2.1
        ts_impl.sys.setImmediate = setImmediate;
        ts_impl.sys.clearImmediate = clearImmediate;
        if (typeof global !== "undefined" && global.gc) {
            ts_impl.sys.gc = function () { return global.gc(); };
        }
        ts_impl.sys.getExecutingFilePath = function () {
            return serverFile;
        };
        var pollingWatchedFileSet = createPollingWatchedFileSet(ts_impl);
        ts_impl.sys.watchFile = function (fileName, callback) {
            var watchedFile = pollingWatchedFileSet.addFile(fileName, callback);
            return {
                close: function () { return pollingWatchedFileSet.removeFile(watchedFile); }
            };
        };
        ts_impl.sys.require = function (initialDir, moduleName) {
            try {
                var path = void 0;
                if (ts_impl.resolveJavaScriptModule) {
                    path = ts_impl.resolveJavaScriptModule(moduleName, initialDir, ts_impl.sys);
                }
                else {
                    path = initialDir + "/" + moduleName;
                }
                if (logger_impl_1.isLogEnabled) {
                    logger_impl_1.serverLogger("Resolving plugin with path " + path);
                }
                return {
                    module: require(path),
                    error: undefined
                };
            }
            catch (error) {
                logger_impl_1.serverLogger("Error while resolving plugin " + error);
                return { module: undefined, error: error };
            }
        };
        if (typeof ts_impl.server.CommandNames === "undefined") {
            //in ts2.4 names were migrated to types
            ts_impl.server.CommandNames = ts_impl.server.protocol.CommandTypes;
        }
    };
    TypeScriptLanguagePlugin.prototype.getSession = function (ts_impl, loggerImpl, defaultOptionsHolder, pathProcessor, mainFile, projectEmittedWithAllFiles) {
        var sessionClass = ts_session_1.createSessionClass(ts_impl, loggerImpl, defaultOptionsHolder, pathProcessor, projectEmittedWithAllFiles, mainFile);
        return ts_session_provider_1.getSession(ts_impl, loggerImpl, defaultOptionsHolder, mainFile, projectEmittedWithAllFiles, sessionClass);
    };
    TypeScriptLanguagePlugin.prototype.onMessage = function (p, writer) {
        this._session.onMessage(p);
    };
    return TypeScriptLanguagePlugin;
}());
exports.TypeScriptLanguagePlugin = TypeScriptLanguagePlugin;
var TypeScriptLanguagePluginFactory = (function () {
    function TypeScriptLanguagePluginFactory() {
    }
    TypeScriptLanguagePluginFactory.prototype.create = function (state) {
        var typeScriptLanguagePlugin = new TypeScriptLanguagePlugin(state);
        return {
            languagePlugin: typeScriptLanguagePlugin,
            readyMessage: typeScriptLanguagePlugin.readyMessage
        };
    };
    return TypeScriptLanguagePluginFactory;
}());
exports.TypeScriptLanguagePluginFactory = TypeScriptLanguagePluginFactory;
//copy ts-server implementation
function createPollingWatchedFileSet(ts_impl, interval, chunkSize) {
    if (interval === void 0) { interval = 2500; }
    if (chunkSize === void 0) { chunkSize = 30; }
    var fs = require("fs");
    var watchedFiles = [];
    var nextFileToCheck = 0;
    var watchTimer;
    function getModifiedTime(fileName) {
        return fs.statSync(fileName).mtime;
    }
    function poll(checkedIndex) {
        var watchedFile = watchedFiles[checkedIndex];
        if (!watchedFile) {
            return;
        }
        fs.stat(watchedFile.fileName, function (err, stats) {
            if (err) {
                watchedFile.callback(watchedFile.fileName);
            }
            else if (watchedFile.mtime.getTime() !== stats.mtime.getTime()) {
                watchedFile.mtime = getModifiedTime(watchedFile.fileName);
                watchedFile.callback(watchedFile.fileName, watchedFile.mtime.getTime() === 0);
            }
        });
    }
    // this implementation uses polling and
    // stat due to inconsistencies of fs.watch
    // and efficiency of stat on modern filesystems
    function startWatchTimer() {
        watchTimer = setInterval(function () {
            var count = 0;
            var nextToCheck = nextFileToCheck;
            var firstCheck = -1;
            while ((count < chunkSize) && (nextToCheck !== firstCheck)) {
                poll(nextToCheck);
                if (firstCheck < 0) {
                    firstCheck = nextToCheck;
                }
                nextToCheck++;
                if (nextToCheck === watchedFiles.length) {
                    nextToCheck = 0;
                }
                count++;
            }
            nextFileToCheck = nextToCheck;
        }, interval);
    }
    function addFile(fileName, callback) {
        var file = {
            fileName: fileName,
            callback: callback,
            mtime: getModifiedTime(fileName)
        };
        watchedFiles.push(file);
        if (watchedFiles.length === 1) {
            startWatchTimer();
        }
        return file;
    }
    function removeFile(file) {
        unorderedRemoveItem(watchedFiles, file);
    }
    function unorderedRemoveItem(array, item) {
        unorderedRemoveFirstItemWhere(array, function (element) { return element === item; });
    }
    function unorderedRemoveFirstItemWhere(array, predicate) {
        for (var i = 0; i < array.length; i++) {
            if (predicate(array[i])) {
                unorderedRemoveItemAt(array, i);
                break;
            }
        }
    }
    function unorderedRemoveItemAt(array, index) {
        // Fill in the "hole" left at `index`.
        array[index] = array[array.length - 1];
        array.pop();
    }
    return {
        getModifiedTime: getModifiedTime,
        poll: poll,
        startWatchTimer: startWatchTimer,
        addFile: addFile,
        removeFile: removeFile
    };
}
var factory = new TypeScriptLanguagePluginFactory();
exports.factory = factory;
