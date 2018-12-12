"use strict";
exports.__esModule = true;
var logger_impl_1 = require("./logger-impl");
var DefaultOptionsHolder = (function () {
    function DefaultOptionsHolder(defaultOptions, ts_impl, pluginState) {
        this.defaultOptions = defaultOptions;
        this.pluginState = pluginState;
        if (defaultOptions && defaultOptions.project) {
            var configOptions = null;
            try {
                configOptions = this.getConfigOptions(defaultOptions, ts_impl);
            }
            catch (err) {
                if (logger_impl_1.isLogEnabled) {
                    throw err;
                }
                configOptions = { commonDefaultOptions: defaultOptions };
            }
            this.options = configOptions.commonDefaultOptions;
            this.configFileName = configOptions.configFileName;
        }
        else {
            this.options = defaultOptions;
        }
    }
    DefaultOptionsHolder.prototype.isUseSingleInferredProject = function () {
        if (this.pluginState) {
            if (this.pluginState.isUseSingleInferredProject != null) {
                return this.pluginState.isUseSingleInferredProject;
            }
        }
        return true;
    };
    DefaultOptionsHolder.prototype.showParentConfigWarning = function () {
        return this.options == null && !(this.pluginState.hasManualParams);
    };
    DefaultOptionsHolder.prototype.hasConfig = function () {
        return this.configFileName != null;
    };
    DefaultOptionsHolder.prototype.watchConfig = function (callback, ts_impl) {
        var _this = this;
        if (this.configFileName) {
            this.updateConfigCallback = callback;
            ts_impl.sys.watchFile(this.configFileName, function (file, isRemoved) {
                _this.refresh(ts_impl);
            });
        }
    };
    DefaultOptionsHolder.prototype.refresh = function (ts_impl) {
        if (this.configFileName) {
            try {
                var configOptions = this.getConfigOptions(this.defaultOptions, ts_impl);
                if (this.configFileName) {
                    this.options = configOptions.commonDefaultOptions;
                    var rawOptions = this.options;
                    if (rawOptions.compileOnSave == null) {
                        rawOptions.compileOnSave = true;
                    }
                    if (rawOptions.compilerOptions) {
                        rawOptions.compilerOptions.___processed_marker = true;
                    }
                    this.configFileName = configOptions.configFileName;
                    if (this.updateConfigCallback) {
                        this.updateConfigCallback();
                    }
                }
            }
            catch (err) {
                logger_impl_1.serverLogger("Error refreshing tsconfig.json " + this.configFileName + ' ' + err.message + '\n' + err.stack, true);
            }
        }
    };
    DefaultOptionsHolder.prototype.getConfigOptions = function (commonDefaultOptions, ts_impl) {
        try {
            var sys = ts_impl.sys;
            var fileOrDirectory = ts_impl.normalizePath(commonDefaultOptions.project);
            var configFileName = null;
            if (!fileOrDirectory || sys.directoryExists(fileOrDirectory)) {
                configFileName = ts_impl.combinePaths(fileOrDirectory, "tsconfig.json");
                if (!sys.fileExists(configFileName)) {
                    if (logger_impl_1.isLogEnabled) {
                        throw new Error("Config file doesn't exist " + configFileName);
                    }
                    return { commonDefaultOptions: commonDefaultOptions };
                }
            }
            else {
                configFileName = fileOrDirectory;
                if (!sys.fileExists(configFileName)) {
                    if (logger_impl_1.isLogEnabled) {
                        throw new Error("Config file doesn't exist " + configFileName);
                    }
                    return { commonDefaultOptions: commonDefaultOptions };
                }
            }
            if (!configFileName && logger_impl_1.isLogEnabled) {
                throw new Error("Config file doesn't exist " + fileOrDirectory);
            }
            //ok, lets parse typescript config
            var cachedConfigFileText = sys.readFile(configFileName);
            if (cachedConfigFileText) {
                var result = ts_impl.parseConfigFileTextToJson(configFileName, cachedConfigFileText);
                var configObject = result.config;
                if (configObject) {
                    var cwd = sys.getCurrentDirectory();
                    var configParseResult = ts_impl.parseJsonConfigFileContent(configObject, sys, ts_impl.getNormalizedAbsolutePath(ts_impl.getDirectoryPath(configFileName), cwd), commonDefaultOptions, ts_impl.getNormalizedAbsolutePath(configFileName, cwd));
                    if (configParseResult) {
                        return { commonDefaultOptions: configParseResult.options, configFileName: configFileName };
                    }
                    else if (logger_impl_1.isLogEnabled) {
                        throw new Error("Cannot parse config " + commonDefaultOptions.project);
                    }
                }
            }
        }
        catch (err) {
            if (logger_impl_1.isLogEnabled) {
                throw err;
            }
        }
        return { commonDefaultOptions: commonDefaultOptions };
    };
    return DefaultOptionsHolder;
}());
exports.DefaultOptionsHolder = DefaultOptionsHolder;
