/*
 * Copyright 2009, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains various functions and class for io.
 */

tdl.provide('tdl.io');

/**
 * A Module with various io functions and classes.
 * @namespace
 */
tdl.io = tdl.io || {};

/**
 * Creates a LoadInfo object.
 * @param {XMLHttpRequest} opt_request
 *     The request to watch.
 * @return {!tdl.io.LoadInfo} The new LoadInfo.
 * @see tdl.io.LoadInfo
 */
tdl.io.createLoadInfo = function(opt_request) {
  return new tdl.io.LoadInfo(opt_request);
};

/**
 * A class to help with progress reporting for most loading utilities.
 *
 * Example:
 * <pre>
 * var g_loadInfo = null;
 * g_id = window.setInterval(statusUpdate, 500);
 * g_loadInfo = tdl.scene.loadScene('http://google.com/somescene.js',
 *                                  callback);
 *
 * function callback(exception) {
 *   g_loadInfo = null;
 *   window.clearInterval(g_id);
 *   if (!exception) {
 *     // do something with scene just loaded
 *   }
 * }
 *
 * function statusUpdate() {
 *   if (g_loadInfo) {
 *     var progress = g_loadInfo.getKnownProgressInfoSoFar();
 *     document.getElementById('loadstatus').innerHTML = progress.percent;
 *   }
 * }
 * </pre>
 *
 * @constructor
 * @param {XMLHttpRequest} opt_request
 *     The request to watch.
 * @see tdl.loader.Loader
 */
tdl.io.LoadInfo = function(opt_request) {
  this.request_ = opt_request;
  this.streamLength_ = 0;  // because the request may have been freed.
  this.children_ = [];
};

/**
 * Adds another LoadInfo as a child of this LoadInfo so they can be
 * managed as a group.
 * @param {!tdl.io.LoadInfo} loadInfo The child LoadInfo.
 */
tdl.io.LoadInfo.prototype.addChild = function(loadInfo) {
  this.children_.push(loadInfo);
};

/**
 * Marks this LoadInfo as finished.
 */
tdl.io.LoadInfo.prototype.finish = function() {
  if (this.request_) {
    if (this.hasStatus_) {
      this.streamLength_ = this.request_.streamLength;
    }
    this.request_ = null;
  }
};

/**
 * Gets the total bytes that will be streamed known so far.
 * If you are only streaming 1 file then this will be the info for that file but
 * if you have queued up many files using an tdl.loader.Loader only a couple of
 * files are streamed at a time meaning that the size is not known for files
 * that have yet started to download.
 *
 * If you are downloading many files for your application and you want to
 * provide a progress status you have about 4 options
 *
 * 1) Use LoadInfo.getTotalBytesDownloaded() /
 * LoadInfo.getTotalKnownBytesToStreamSoFar() and just be aware the bar will
 * grown and then shrink as new files start to download and their lengths
 * become known.
 *
 * 2) Use LoadInfo.getTotalRequestsDownloaded() /
 * LoadInfo.getTotalKnownRequestsToStreamSoFar() and be aware the granularity
 * is not all that great since it only reports fully downloaded files. If you
 * are downloading a bunch of small files this might be ok.
 *
 * 3) Put all your files in one archive. Then there will be only one file and
 * method 1 will work well.
 *
 * 4) Figure out the total size in bytes of the files you will download and put
 * that number in your application, then use LoadInfo.getTotalBytesDownloaded()
 * / MY_APPS_TOTAL_BYTES_TO_DOWNLOAD.
 *
 * @return {number} The total number of currently known bytes to be streamed.
 */
tdl.io.LoadInfo.prototype.getTotalKnownBytesToStreamSoFar = function() {
  //if (!this.streamLength_ && this.request_ && this.hasStatus_) {
  //  //
  //  //this.streamLength_ = this.request_.streamLength;
  //}
  var total = this.streamLength_;
  for (var cc = 0; cc < this.children_.length; ++cc) {
    total += this.children_[cc].getTotalKnownBytesToStreamSoFar();
  }
  return total;
};

/**
 * Gets the total bytes downloaded so far.
 * @return {number} The total number of currently known bytes to be streamed.
 */
tdl.io.LoadInfo.prototype.getTotalBytesDownloaded = function() {
  var total = (this.request_ && this.hasStatus_) ?
              this.request_.bytesReceived : this.streamLength_;
  for (var cc = 0; cc < this.children_.length; ++cc) {
    total += this.children_[cc].getTotalBytesDownloaded();
  }
  return total;
};

/**
 * Gets the total streams that will be download known so far.
 * We can't know all the streams since you could use an tdl.loader.Loader
 * object, request some streams, then call this function, then request some
 * more.
 *
 * See LoadInfo.getTotalKnownBytesToStreamSoFar for details.
 * @return {number} The total number of requests currently known to be streamed.
 * @see tdl.io.LoadInfo.getTotalKnownBytesToStreamSoFar
 */
tdl.io.LoadInfo.prototype.getTotalKnownRequestsToStreamSoFar = function() {
  var total = 1;
  for (var cc = 0; cc < this.children_.length; ++cc) {
    total += this.children_[cc].getTotalKnownRequestToStreamSoFar();
  }
  return total;
};

/**
 * Gets the total requests downloaded so far.
 * @return {number} The total requests downloaded so far.
 */
tdl.io.LoadInfo.prototype.getTotalRequestsDownloaded = function() {
  var total = this.request_ ? 0 : 1;
  for (var cc = 0; cc < this.children_.length; ++cc) {
    total += this.children_[cc].getTotalRequestsDownloaded();
  }
  return total;
};

/**
 * Gets progress info.
 * This is commonly formatted version of the information available from a
 * LoadInfo.
 *
 * See LoadInfo.getTotalKnownBytesToStreamSoFar for details.
 * @return {{percent: number, downloaded: string, totalBytes: string,
 *     base: number, suffix: string}} progress info.
 * @see tdl.io.LoadInfo.getTotalKnownBytesToStreamSoFar
 */
tdl.io.LoadInfo.prototype.getKnownProgressInfoSoFar = function() {
  var percent = 0;
  var bytesToDownload = this.getTotalKnownBytesToStreamSoFar();
  var bytesDownloaded = this.getTotalBytesDownloaded();
  if (bytesToDownload > 0) {
    percent = Math.floor(bytesDownloaded / bytesToDownload * 100);
  }

  var base = (bytesToDownload < 1024 * 1024) ? 1024 : (1024 * 1024);

  return {
    percent: percent,
    downloaded: (bytesDownloaded / base).toFixed(2),
    totalBytes: (bytesToDownload / base).toFixed(2),
    base: base,
    suffix: (base == 1024 ? 'kb' : 'mb')}

};

/**
 * Loads text from an external file. This function is synchronous.
 * @param {string} url The url of the external file.
 * @return {string} the loaded text if the request is synchronous.
 */
tdl.io.loadTextFileSynchronous = function(url) {
  var error = 'loadTextFileSynchronous failed to load url "' + url + '"';
  var request;
  if (window.XMLHttpRequest) {
    request = new XMLHttpRequest();
    if (request.overrideMimeType) {
      request.overrideMimeType('text/plain');
    }
  } else if (window.ActiveXObject) {
    request = new ActiveXObject('MSXML2.XMLHTTP.3.0');
  } else {
    throw 'XMLHttpRequest is disabled';
  }
  request.open('GET', url, false);
  request.send(null);
  if (request.readyState != 4) {
    throw error;
  }
  return request.responseText;
};

/**
 * Loads text from an external file. This function is asynchronous.
 * @param {string} url The url of the external file.
 * @param {function(string, *): void} callback A callback passed the loaded
 *     string and an exception which will be null on success.
 * @return {!tdl.io.LoadInfo} A LoadInfo to track progress.
 */
tdl.io.loadTextFile = function(url, callback) {
  var error = 'loadTextFile failed to load url "' + url + '"';
  var request;
  if (window.XMLHttpRequest) {
    request = new XMLHttpRequest();
    if (request.overrideMimeType) {
      request.overrideMimeType('text/plain; charset=utf-8');
    }
  } else if (window.ActiveXObject) {
    request = new ActiveXObject('MSXML2.XMLHTTP.3.0');
  } else {
    throw 'XMLHttpRequest is disabled';
  }
  var loadInfo = tdl.io.createLoadInfo(request, false);
  request.open('GET', url, true);
  var finish = function() {
    if (request.readyState == 4) {
      var text = '';
      // HTTP reports success with a 200 status. The file protocol reports
      // success with zero. HTTP does not use zero as a status code (they
      // start at 100).
      // https://developer.mozilla.org/En/Using_XMLHttpRequest
      var success = request.status == 200 || request.status == 0;
      if (success) {
        text = request.responseText;
      }
      loadInfo.finish();
      callback(text, success ? null : 'could not load: ' + url);
    }
  };
  request.onreadystatechange = finish;
  request.send(null);
  return loadInfo;
};

/**
 * Loads a file from an external file. This function is
 * asynchronous.
 * @param {string} url The url of the external file.
 * @param {function(string, *): void} callback A callback passed the loaded
 *     ArrayBuffer and an exception which will be null on
 *     success.
 * @return {!tdl.io.LoadInfo} A LoadInfo to track progress.
 */
tdl.io.loadArrayBuffer = function(url, callback) {
  var error = 'loadArrayBuffer failed to load url "' + url + '"';
  var request;
  if (window.XMLHttpRequest) {
    request = new XMLHttpRequest();
  } else {
    throw 'XMLHttpRequest is disabled';
  }
  var loadInfo = tdl.io.createLoadInfo(request, false);
  request.open('GET', url, true);
  var finish = function() {
    if (request.readyState == 4) {
      var text = '';
      // HTTP reports success with a 200 status. The file protocol reports
      // success with zero. HTTP does not use zero as a status code (they
      // start at 100).
      // https://developer.mozilla.org/En/Using_XMLHttpRequest
      var success = request.status == 200 || request.status == 0;
      if (success) {
        arrayBuffer = request.response;
      }
      loadInfo.finish();
      callback(arrayBuffer, success ? null : 'could not load: ' + url);
    }
  };
  request.onreadystatechange = finish;
  if (request.responseType === undefined) {
    throw 'no support for binary files';
  }
  request.responseType = "arraybuffer";
  request.send(null);
  return loadInfo;
};

/**
 * Loads JSON from an external file. This function is asynchronous.
 * @param {string} url The url of the external file.
 * @param {function(jsonObject, *): void} callback A callback passed the loaded
 *     json and an exception which will be null on success.
 * @return {!tdl.io.LoadInfo} A LoadInfo to track progress.
 */
tdl.io.loadJSON = function(url, callback) {
  var error = 'loadJSON failed to load url "' + url + '"';
  var request;
  if (window.XMLHttpRequest) {
    request = new XMLHttpRequest();
    if (request.overrideMimeType) {
      request.overrideMimeType('text/plain');
    }
  } else if (window.ActiveXObject) {
    request = new ActiveXObject('MSXML2.XMLHTTP.3.0');
  } else {
    throw 'XMLHttpRequest is disabled';
  }
  var loadInfo = tdl.io.createLoadInfo(request, false);
  request.open('GET', url, true);
  var finish = function() {
    if (request.readyState == 4) {
      var json = undefined;
      // HTTP reports success with a 200 status. The file protocol reports
      // success with zero. HTTP does not use zero as a status code (they
      // start at 100).
      // https://developer.mozilla.org/En/Using_XMLHttpRequest
      var success = request.status == 200 || request.status == 0;
      if (success) {
        try {
          json = JSON.parse(request.responseText);
        } catch (e) {
          success = false;
        }
      }
      loadInfo.finish();
      callback(json, success ? null : 'could not load: ' + url);
    }
  };
  try {
    request.onreadystatechange = finish;
    request.send(null);
  } catch (e) {
    callback(null, 'could not load: ' + url);
  }
  return loadInfo;
};

/**
 * Sends an object. This function is asynchronous.
 * @param {string} url The url of the external file.
 * @param {function(jsonObject, *): void} callback A callback passed the loaded
 *     json and an exception which will be null on success.
 * @return {!tdl.io.LoadInfo} A LoadInfo to track progress.
 */
tdl.io.sendJSON = function(url, jsonObject, callback) {
  var error = 'sendJSON failed to load url "' + url + '"';
  var request;
  if (window.XMLHttpRequest) {
    request = new XMLHttpRequest();
    if (request.overrideMimeType) {
      request.overrideMimeType('text/plain');
    }
  } else if (window.ActiveXObject) {
    request = new ActiveXObject('MSXML2.XMLHTTP.3.0');
  } else {
    throw 'XMLHttpRequest is disabled';
  }
  var loadInfo = tdl.io.createLoadInfo(request, false);
  request.open('POST', url, true);
  var js = JSON.stringify(jsonObject);
  var finish = function() {
    if (request.readyState == 4) {
      var json = undefined;
      // HTTP reports success with a 200 status. The file protocol reports
      // success with zero. HTTP does not use zero as a status code (they
      // start at 100).
      // https://developer.mozilla.org/En/Using_XMLHttpRequest
      var success = request.status == 200 || request.status == 0;
      if (success) {
        try {
          json = JSON.parse(request.responseText);
        } catch (e) {
          success = false;
        }
      }
      loadInfo.finish();
      callback(json, success ? null : 'could not load: ' + url);
    }
  };
  try {
    request.onreadystatechange = finish;
    request.setRequestHeader("Content-type", "application/json");
    request.send(js);
  } catch (e) {
    callback(null, 'could not load: ' + url);
  }
  return loadInfo;
};


