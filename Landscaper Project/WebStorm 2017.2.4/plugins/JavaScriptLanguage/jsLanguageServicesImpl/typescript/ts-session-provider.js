"use strict";
exports.__esModule = true;
var util_1 = require("./util");
var ts_session_old_1 = require("./ts-session-old");
var ts_session_new_1 = require("./ts-session-new");
function getSession(ts_impl /*must be typeof ts */, logger, defaultOptionsHolder, mainFile, projectEmittedWithAllFiles, sessionClass) {
    var TypeScriptProjectService = ts_impl.server.ProjectService;
    var TypeScriptCommandNames = ts_impl.server.CommandNames;
    util_1.initCommandNames(TypeScriptCommandNames);
    var host = ts_impl.sys;
    var wasFirstMessage = false;
    var version = ts_impl.version;
    var isTS1X = version.indexOf("1.") == 0;
    var isTS2X = version.indexOf("2.") == 0;
    var isTS20 = isTS2X && version.indexOf("2.0") == 0;
    var session;
    if (isTS1X || isTS20 && isOld20()) {
        session = ts_session_old_1.getSessionOld(sessionClass, TypeScriptProjectService, TypeScriptCommandNames, logger, host, ts_impl, defaultOptionsHolder, mainFile, projectEmittedWithAllFiles);
    }
    else {
        session = ts_session_new_1.getSessionNew(sessionClass, TypeScriptProjectService, TypeScriptCommandNames, logger, host, ts_impl, defaultOptionsHolder, mainFile, projectEmittedWithAllFiles);
    }
    return session;
    function isOld20() {
        for (var i = 0; i < 6; i++) {
            var expectedVersion = "2.0." + i;
            if (expectedVersion == version ||
                version.indexOf(expectedVersion + ".") == 0) {
                return true;
            }
        }
        return false;
    }
}
exports.getSession = getSession;
