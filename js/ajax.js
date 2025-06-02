"use strict";

/**
 * @typedef {Object} AJAXRequest Definition for making requests in {@link doAJAX}.
 * @property {string} url Request URL
 * @property {("GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH")} method Request method.
 * @property {Record<string, string> | undefined} headers Headers
 * @property {string | undefined} body
 * 
 * @typedef {Object} AJAXResponse Returned object from completed AJAX request.
 * @property {number} status HTTP status code.
 * @property {Record<string, string>} headers Response header.
 * @property {string} body Responde context.
 * 
 * @callback AJAXCompleteCallback Event handler when handling result in {@link doAJAX}.
 * @param {AJAXResponse} response Response made from AJAX.
 * @return {void}
 */

/**
 * 
 * @param {AJAXRequest} req
 * @param {AJAXCompleteCallback} onSuccess 
 * @param {AJAXCompleteCallback | undefined} onError 
 */
function doAJAX(req, onSuccess, onError) {
    if (window.fetch) {
        fetch(req.url, {
            method: req.method,
            headers: req.headers,
            redirect: "follow",
            body: req.body
        }).then(function (rawResp) {
            rawResp.text()
                .then(function (body) {
                    /**
                     * @type {AJAXResponse}
                     */
                    var fresp = {
                        status: rawResp.status,
                        headers: {},
                        body: body
                    };

                    rawResp.headers.forEach(function (v, k) {
                        fresp.headers[k] = v;
                    });

                    if (fresp.status >= 400) {
                        if (typeof onError === "undefined") {
                            throw new Error(req.url + " is unavailable with status " + fresp.status + ".");
                        }

                        onError(fresp);
                    } else {
                        onSuccess(fresp);
                    }
                });

        });

    } else if (window.XMLHttpRequest) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState !== this.DONE) {
                return;
            }

            /**
             * @type {AJAXResponse}
             */
            var xhrresp = {
                status: this.status,
                headers: {},
                body: this.responseText
            };

            var headerArr = this.getAllResponseHeaders()
                .trim()
                .split(/[\r\n]+/);

            headerArr.forEach(function (pair) {
                var segment = pair.split(": ");
                var name = segment.shift();
                var value = segment.join(": ");

                xhrresp.headers[name] = value;
            });

            if (xhrresp.status >= 400) {
                if (typeof onError === "undefined") {
                    throw new Error(req.url + " is unavailable with status " + xhrresp.status + ".");
                }

                onError(xhrresp);
            } else if (xhrresp.status >= 300 && xhrresp.status < 400) {
                /**
                 * @type {AJAXRequest}
                 */
                var clonedReq = JSON.parse(JSON.stringify(req));

                clonedReq.url = xhrresp.headers["location"];

                doAJAX(clonedReq, onSuccess, onError);
            } else {
                onSuccess(xhrresp);
            }

            xhr.open(req.method, req.url, true);

            if (typeof req.headers !== "undefined") {
                req.headers.keys.forEach(function (k) {
                    xhr.setRequestHeader(k, req.headers[k]);
                });
            }

            xhr.send();
        }
    } else {
        throw new Error("No AJAX API available in this browser");
    }
}