"use strict";
exports.__esModule = true;
function initCommandNames(TypeScriptCommandNames) {
    TypeScriptCommandNames.IDEChangeFiles = "ideChangeFiles";
    TypeScriptCommandNames.IDECompile = "ideCompile";
    TypeScriptCommandNames.IDEGetErrors = "ideGetErr";
    TypeScriptCommandNames.IDEGetAllErrors = "ideGetAllErr";
    TypeScriptCommandNames.IDECompletions = "ideCompletions";
    TypeScriptCommandNames.IDEComposite = "IDEComposite";
    TypeScriptCommandNames.IDEGetMainFileErrors = "ideGetMainFileErr";
    TypeScriptCommandNames.IDEGetProjectErrors = "ideGetProjectErr";
    TypeScriptCommandNames.IDEEmpty = "IDEEmpty";
    if (TypeScriptCommandNames.ReloadProjects == undefined) {
        TypeScriptCommandNames.ReloadProjects = "reloadProjects";
    }
}
exports.initCommandNames = initCommandNames;
exports.DETAILED_COMPLETION_COUNT = 30;
exports.DETAILED_MAX_TIME = 150;
function isTypeScript15(ts_impl) {
    return checkVersion(ts_impl, "1.5");
}
exports.isTypeScript15 = isTypeScript15;
function isTypeScript16(ts_impl) {
    return checkVersion(ts_impl, "1.6");
}
exports.isTypeScript16 = isTypeScript16;
function isTypeScript17(ts_impl) {
    return checkVersion(ts_impl, "1.7");
}
exports.isTypeScript17 = isTypeScript17;
function isTypeScript20(ts_impl) {
    return checkVersion(ts_impl, "2.0");
}
exports.isTypeScript20 = isTypeScript20;
function checkVersion(ts_impl, versionText) {
    return ts_impl.version && (ts_impl.version == versionText || ts_impl.version.indexOf(versionText) == 0);
}
/**
 * Default tsserver implementation doesn't return response in most cases ("open", "close", etc.)
 * we want to override the behaviour and send empty-response holder
 */
exports.doneRequest = {
    responseRequired: true,
    response: "done"
};
var DiagnosticsContainer = (function () {
    function DiagnosticsContainer() {
        this.value = {};
    }
    DiagnosticsContainer.prototype.reset = function () {
        this.value = {};
    };
    return DiagnosticsContainer;
}());
exports.DiagnosticsContainer = DiagnosticsContainer;
function copyPropertiesInto(fromObject, toObject) {
    for (var obj in fromObject) {
        if (fromObject.hasOwnProperty(obj)) {
            toObject[obj] = fromObject[obj];
        }
    }
}
exports.copyPropertiesInto = copyPropertiesInto;
function extendEx(ObjectToExtend, name, func) {
    var proto = ObjectToExtend.prototype;
    var oldFunction = proto[name];
    proto[name] = function () {
        return func.apply(this, [oldFunction, arguments]);
    };
}
exports.extendEx = extendEx;
function parseNumbersInVersion(version) {
    var result = [];
    var versions = version.split(".");
    for (var _i = 0, versions_1 = versions; _i < versions_1.length; _i++) {
        version = versions_1[_i];
        if (version == null || version === "") {
            break;
        }
        var currentNumber = Number(version);
        if (currentNumber == null || isNaN(currentNumber)) {
            break;
        }
        result = result.concat(currentNumber);
    }
    return result;
}
exports.parseNumbersInVersion = parseNumbersInVersion;
function isVersionMoreOrEqual(version) {
    var expected = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        expected[_i - 1] = arguments[_i];
    }
    for (var i = 0; i < expected.length; i++) {
        var expectedNumber = expected[i];
        var currentNumber = version.length > i ? version[i] : 0;
        if (currentNumber < expectedNumber)
            return false;
        if (currentNumber > expectedNumber)
            return true;
    }
    return version.length >= expected.length;
}
exports.isVersionMoreOrEqual = isVersionMoreOrEqual;
function isFunctionKind(kind) {
    return kind == "method" ||
        kind == "local function" ||
        kind == "function" ||
        kind == "call" ||
        kind == "construct";
}
exports.isFunctionKind = isFunctionKind;
