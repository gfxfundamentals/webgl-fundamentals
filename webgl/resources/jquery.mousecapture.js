/*
 *
 * jquery.mousecapture.js
 * version 1.1
 * by Sander Dieleman <sanderdieleman at gmail dot com>
 * A simple mouse capturing plugin for jQuery.
 *
 *
 * LICENSE
 *
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details.  
 *
 * 
 * USAGE
 *
 * $( ... ).mousecapture({
 *     "down": function(event, sharedData) { ... },
 *     "move": function(event, sharedData) { ... },
 *     "up": function(event, sharedData) { ... }
 * });
 *
 * "down", "move" and "up" are the handlers for the mousedown, mousemove and
 * mouseup events respectively. Only "down" is required.
 *
 * The unmodified event object is passed to the handlers (event), as well as
 * a blank slate object (sharedData) which can be used to store data that
 * needs to be shared between the handlers. Alternatively, shared variables
 * can be declared before the mousecapture call.
 *
 * Inside the handlers, "this" refers to the target element, just like when
 * jQuery's regular mouse events would be used.
 *
 *
 * DEMO
 *
 * A demo is available at:
 * http://benanne.net/misc/jquery-plugins/mousecapture/demo.html
 *
 * 
 * MORE INFORMATION
 *
 * Read http://benanne.net/code/?p=238 for more information.
 *
 *
 * CHANGES
 *
 * v1.2
 * - the context in which the down and up handlers are executed should be
 *   "$this", not "target".
 * - moved some code around to make it smaller: it doesn't matter wether
 *   the handlers are attached / unattached before or after the actual
 *   handler is executed. At least I think it doesn't.
 *
 * v1.1
 * - added "return this" to the mousecapture method, so it conforms to the
 *   jQuery plugin authoring guidelines.
 * 
 * v1.0
 * - first version
 *
 */

(function($) {

    $.fn.mousecapture = function(params) {
        var $doc = $(document);
        
        this.each(function() {
            var $this = $(this);
            var sharedData = {};
            
            $this.mousedown(function(e) {                
                // mousemove
                
                var moveHandler;
                
                var capture = true;
                if (params.mouseCapture) {
                    capture = params.mouseCapture.call($this, e, sharedData);
                }

                if (capture && params.move) {
                    moveHandler = function(e) {
                        params.move.call($this, e, sharedData);
                    };
                    
                   $doc.mousemove(moveHandler);
                }
                
                // mouseup                
                                
                var upHandler;
                
                var unbind = function() {
                    if (params.move) $doc.unbind("mousemove", moveHandler);
                    $doc.unbind("mouseup", upHandler);
                };
                
                if (params.up) {
                    upHandler = function(e) {
                        unbind();
                        return params.up.call($this, e, sharedData);
                    };
                }
                else {
                    upHandler = unbind;
                }
                
                $doc.mouseup(upHandler);
                
                // mousedown
                
                return params.down.call($this, e, sharedData);
            });
        });
        
        return this;
    };

})(jQuery);

