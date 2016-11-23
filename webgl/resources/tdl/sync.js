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
 * @fileoverview This file contains objects to sync app settings across
 * browsers.
 */

tdl.provide('tdl.sync');

tdl.require('tdl.log');
tdl.require('tdl.io');
tdl.require('tdl.misc');

/**
 * A module for sync.
 * @namespace
 */
tdl.sync = tdl.sync || {};

/**
 * Manages synchronizing settings across browsers. Requires a server
 * running to support it. Note that even if you don't want to sync
 * across browsers you can still use the SyncManager.
 *
 * @constructor
 * @param {!Object} settings The object that contains the settings you
 *     want kept in sync.
 */
tdl.sync.SyncManager = function(settings, opt_callback) {
  this.settings = settings;
  this.putCount = 0;
  this.getCount = 0;
  this.callback = opt_callback || function() {};

  // This probably should not be here.
  tdl.misc.applyUrlSettings(settings);
}

/**
 * Initialize the sync manager to start syncing settings with a server.
 * @param {string} server domain name of server.
 * @param {number} port port of server.
 * @param {boolean} slave true if this page is a slave. Slaves only receive
 *     settings from the server. Non slaves send settings the server.
 */
tdl.sync.SyncManager.prototype.init = function(url, slave) {
  var that = this;
  this.sync = true;
  this.slave = slave;
  this.socket = new WebSocket(url);
  this.opened = false;
  this.queued = [];
  this.socket.onopen = function(event) {
    tdl.log("SOCKET OPENED!");
    that.opened = true;
    for (var ii = 0; ii < that.queued.length; ++ii) {
      var settings = that.queued[ii];
      ++that.putCount;
      tdl.log("--PUT:[", that.putCount, "]-------------");
      tdl.log(settings);
      that.socket.send(settings);
    }
    that.queued = [];
  };
  this.socket.onerror = function(event) {
    tdl.log("SOCKET ERROR!");
  };
  this.socket.onclose = function(event) {
    tdl.log("SOCKET CLOSED!");
  };
  this.socket.onmessage = function(event) {
    ++that.getCount;
    tdl.log("--GET:[", g_getCount, ":", event.type, "]-------------");
    var obj = JSON.parse(event.data);
    tdl.dumpObj(obj);
    tdl.misc.copyProperties(obj, that.settings);
    that.callback(obj);
  };
};

/**
 * Sets the settings.
 *
 * If we are synchronizing settings the settings are sent to the server.
 * Otherwise they are applied directy.
 *
 * @param {!Object} settings Object with new settings.
 */
tdl.sync.SyncManager.prototype.setSettings = function(settings) {
  if (this.sync) {
    if (!this.slave) {
      if (this.socket) {
        if (!this.opened) {
          this.queued.push(JSON.stringify(settings));
        } else {
          ++this.putCount;
          tdl.log("--PUT:[", this.putCount, "]-------------");
          tdl.dumpObj(settings);
          this.socket.send(JSON.stringify(settings));
        }
      }
    }
  } else {
    tdl.misc.copyProperties(settings, this.settings);
    this.callback(settings);
  }
};


