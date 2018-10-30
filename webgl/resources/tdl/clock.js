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
 * @fileoverview This file contains various functions for managing a clock
 */

tdl.provide('tdl.clock');

tdl.require('tdl.io');
tdl.require('tdl.log');

/**
 * Creates a clock. Optionally synced to a server
 * @param {number} opt_syncRate. If passed, this is the number of seconds
 *        between syncing to the server. If not passed the local clock is used.
 *        Note: If the client is faster than the server this means it's possible
 *        the clock will report a certain time and then later a previous time.
 */
tdl.clock.createClock = function(opt_syncRate, opt_url) {
  if (opt_syncRate) {
    return new tdl.clock.SyncedClock(opt_syncRate, opt_url);
  } else {
    return new tdl.clock.LocalClock();
  }
};


/**
 * A clock that gets the local current time in seconds.
 * @private
 */
tdl.clock.LocalClock = function() {
}

/**
 * Gets the current time in seconds.
 * @private
 */
tdl.clock.LocalClock.prototype.getTime = function() {
  return (new Date()).getTime() * 0.001;
}

/**
 * A clock that gets the current time in seconds attempting to eep the clock
 * synced to the server.
 * @private
 */
tdl.clock.SyncedClock = function(opt_syncRate, opt_url) {
  this.url = opt_url || window.location.href;
  this.syncRate = opt_syncRate || 10;
  this.timeOffset = 0;
  this.syncToServer();
}

tdl.clock.SyncedClock.prototype.getLocalTime_ = function() {
  return (new Date()).getTime() * 0.001;
}

tdl.clock.SyncedClock.prototype.syncToServer = function() {
  var that = this;
  var sendTime = this.getLocalTime_();
  tdl.io.sendJSON(this.url, {cmd: 'time'}, function(obj, exception) {
    if (exception) {
      tdl.log("error: syncToServer: " + exception);
    } else {
      var receiveTime = that.getLocalTime_();
      var duration = receiveTime - sendTime;
      var serverTime = obj.time + duration * 0.5;
      that.timeOffset = serverTime - receiveTime;
      tdl.log("new timeoffset: " + that.timeOffset);
    }
    setTimeout(function() {
        that.syncToServer();
      }, that.syncRate * 1000);
  });
};

/**
 * Gets the current time in seconds.
 * @private
 */
tdl.clock.SyncedClock.prototype.getTime = function() {
  return (new Date()).getTime() * 0.001 + this.timeOffset;
}

