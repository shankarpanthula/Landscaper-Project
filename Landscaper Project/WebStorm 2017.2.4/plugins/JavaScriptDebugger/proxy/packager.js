// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var request_1 = require("./request");
var Packager = (function () {
    function Packager() {
    }
    Packager.isPackagerRunning = function (packagerURL) {
        var statusURL = "http://" + packagerURL + "/status";
        return new request_1.Request().request(statusURL)
            .then(function (body) {
            return body === "packager-status:running";
        }, function (error) {
            return false;
        });
    };
    Packager.getHostForPort = function (port) {
        return "localhost:" + port;
    };
    return Packager;
}());
exports.Packager = Packager;
