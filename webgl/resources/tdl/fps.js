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
 * @fileoverview This file contains objects to measure frames
 *               per second.
 */

tdl.provide('tdl.fps');

/**
 * A module for fps.
 * @namespace
 */
tdl.fps = tdl.fps || {};

/**
 * Number of frames to average over for computing FPS.
 * @type {number}
 */
tdl.fps.NUM_FRAMES_TO_AVERAGE = 16;

/**
 * Measures frames per second.
 * @constructor
 */
tdl.fps.FPSTimer = function() {
  // total time spent for last N frames.
  this.totalTime_ = tdl.fps.NUM_FRAMES_TO_AVERAGE;

  // elapsed time for last N frames.
  this.timeTable_ = [];

  // where to record next elapsed time.
  this.timeTableCursor_ = 0;

  // Initialize the FPS elapsed time history table.
  for (var tt = 0; tt < tdl.fps.NUM_FRAMES_TO_AVERAGE; ++tt) {
    this.timeTable_[tt] = 1.0;
  }
};

/**
 * Updates the fps measurement. You must call this in your
 * render loop.
 *
 * @param {number} elapsedTime The elasped time in seconds
 *     since the last frame.
 */
tdl.fps.FPSTimer.prototype.update = function(elapsedTime) {
  // Keep the total time and total active time for the last N frames.
  this.totalTime_ += elapsedTime - this.timeTable_[this.timeTableCursor_];

  // Save off the elapsed time for this frame so we can subtract it later.
  this.timeTable_[this.timeTableCursor_] = elapsedTime;

  // Wrap the place to store the next time sample.
  ++this.timeTableCursor_;
  if (this.timeTableCursor_ == tdl.fps.NUM_FRAMES_TO_AVERAGE) {
    this.timeTableCursor_ = 0;
  }

  this.instantaneousFPS = Math.floor(1.0 / elapsedTime + 0.5);
  this.averageFPS = Math.floor(
      (1.0 / (this.totalTime_ / tdl.fps.NUM_FRAMES_TO_AVERAGE)) + 0.5);
};



