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
 * @fileoverview This file contains a loader class for helping to load
 *     muliple assets in an asynchronous manner.
 */

tdl.provide('tdl.loader');

tdl.require('tdl.io');

/**
 * A Module with a loader class for helping to load muliple assets in an
 * asynchronous manner.
 * @namespace
 */
tdl.loader = tdl.loader || {};

/**
 * A simple Loader class to call some callback when everything has loaded.
 * @constructor
 * @param {!function(): void} onFinished Function to call when final item has
 *        loaded.
 */
tdl.loader.Loader = function(onFinished)  {
  this.count_ = 1;
  this.onFinished_ = onFinished;

  /**
   * The LoadInfo for this loader you can use to track progress.
   * @type {!tdl.io.LoadInfo}
   */
  this.loadInfo = tdl.io.createLoadInfo();
};

/**
 * Creates a Loader for helping to load a bunch of items asychronously.
 *
 * The way you use this is as follows.
 *
 * <pre>
 * var loader = tdl.loader.createLoader(myFinishedCallback);
 * loader.loadTextFile(text1Url, callbackForText);
 * loader.loadTextFile(text2Url, callbackForText);
 * loader.loadTextFile(text3Url, callbackForText);
 * loader.finish();
 * </pre>
 *
 * The loader guarantees that myFinishedCallback will be called after
 * all the items have been loaded.
 *
* @param {!function(): void} onFinished Function to call when final item has
*        loaded.
* @return {!tdl.loader.Loader} A Loader Object.
 */
tdl.loader.createLoader = function(onFinished) {
  return new tdl.loader.Loader(onFinished);
};

/**
 * Loads a text file.
 * @param {string} url URL of scene to load.
 * @param {!function(string, *): void} onTextLoaded Function to call when
 *     the file is loaded. It will be passed the contents of the file as a
 *     string and an exception which is null on success.
 */
tdl.loader.Loader.prototype.loadTextFile = function(url, onTextLoaded) {
  var that = this;  // so the function below can see "this".
  ++this.count_;
  var loadInfo = tdl.io.loadTextFile(url, function(string, exception) {
    onTextLoaded(string, exception);
    that.countDown_();
  });
  this.loadInfo.addChild(loadInfo);
};

/**
 * Creates a loader that is tracked by this loader so that when the new loader
 * is finished it will be reported to this loader.
 * @param {!function(): void} onFinished Function to be called when everything
 *      loaded with this loader has finished.
 * @return {!tdl.loader.Loader} The new Loader.
 */
tdl.loader.Loader.prototype.createLoader = function(onFinished) {
  var that = this;
  ++this.count_;
  var loader = tdl.loader.createLoader(function() {
      onFinished();
      that.countDown_();
  });
  this.loadInfo.addChild(loader.loadInfo);
  return loader;
};

/**
 * Counts down the internal count and if it gets to zero calls the callback.
 * @private
 */
tdl.loader.Loader.prototype.countDown_ = function() {
  --this.count_;
  if (this.count_ === 0) {
    this.onFinished_();
  }
};

/**
 * Finishes the loading process.
 * Actually this just calls countDown_ to account for the count starting at 1.
 */
tdl.loader.Loader.prototype.finish = function() {
  this.countDown_();
};


