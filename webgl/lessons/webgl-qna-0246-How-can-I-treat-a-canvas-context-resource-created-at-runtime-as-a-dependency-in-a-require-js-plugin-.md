Title: How can I treat a canvas context resource created at runtime as a dependency in a require.js plugin?
Description:
TOC: qna

# Question:

I'm trying to create a require.js plugin to load GLSL Shader files, construct a Shader Program, and return it to the module that is using the files as dependencies.  However, I'm wondering if I'm asking my plugin to do something that is both possible and wise in terms of things it should be concerned about.

Right now, I have written the module following the guidelines on require.js' plugin page taking a cue from the `text` and `i18n` plugins.  Those modules have slightly different goals in terms of what they need to accomplish though.  `text` returns file text, which was simple enough to get going.  `i18n` returns an object of localized strings depending on a locale.  Again, somewhat in line with what I want.  However, neither one of those care about what the DOM is doing whenever they run.

In order to get my module working, I need a handle to a `<canvas>` element or a WebGL context created from that canvas.  For brevity, lets consider the context `gl`.

Once I have loaded up the shader source files, I need to use functions within `gl` to put them into the context, compile them, link them, and produce a program to keep track of.  If I have `gl`, there is no issue.  Looking at some of the templating plugins for require.js, I see that they sometimes just create a temporary DOM element, do what they need to do, and return whatever they manufactured using the element.  

This would almost solve my problem except that I don't believe context resources can be shared between one another.  That is to say, if I added a `<canvas>` from within the plugin, got the context, and created the shader, I wouldn't be able to utilize that Shader Program from within the context that I **actually** want to use it in.

Is there a way to have require.js provide the `gl` to my plugin in a convenient way perhaps through the dependencies?  If not, am I asking too much of my plugin and instead should focus on only loading shader source within it and delegating the actual Program construction to another module?

## glsl.js ##

    (function() {
    
        // Parser to grab the shaders to use
        function parse(name) {
            var components = {
                vert : name.match(/v\:(.+)\!/)[1],
                frag : name.match(/f\:(.+)/)[1],
            };
            return components;
        }
    
        // fetchText helper from requirejs/text
        function fetchText(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function(evt) {
                if (xhr.readyState === 4) {
                    callback(xhr.responseText);
                }
            };
            xhr.send(null);
        }
    
        // Construct a Shader Program from components
        function Program(gl, vert, frag) {
            /*
             * Problem is that I don't know how to effectively get "gl" defined here
             */
    
            // Check for validity
            function checkShader(shader) {
                if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.log("All good");
                }
                else {
                    console.log("Error compiling shader: %s", gl.getShaderInfoLog(shader));
                }
            }
    
            var vShader = gl.createShader(gl.VERTEX_SHADER);
            var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    
            gl.shaderSource(vShader, vert);
            gl.shaderSource(fShader, frag);
    
            gl.compileShader(vShader);
            gl.compileShader(fShader);
    
            checkShader(vShader);
            checkShader(fShader);
        }
        //
    
        // Define our GLSL module
        define({
            // Make files module relative
            normalize : function(name, normalize) {
                // Get componenets
                var parsed = parse(name);
    
                // Normalize
                parsed.vert = normalize(parsed.vert);
                parsed.frag = normalize(parsed.frag);
    
                // Return normalized value
                return "v:" + parsed.vert + "!f:" + parsed.frag;
            },
    
            // Do the loading of the Shader
            load : function(name, req, onload, config) {
    
                // Predefine variables
                var components = null, vertPromise = null, fragPromise = null;
    
                // Parse the components
                components = parse(name),
    
                // Make Vertex Promise
                vertPromise = new Promise(function(resolve, reject) {
                    fetchText(req.toUrl(components.vert + ".vert"), function(text) {
                        resolve(text);
                    });
                }),
    
                // Make Fragment Promise
                fragPromise = new Promise(function(resolve, reject) {
                    fetchText(req.toUrl(components.frag + ".frag"), function(text) {
                        resolve(text);
                    });
                });
    
                // Wait for XHR to resolve
                Promise.all([
                        vertPromise,
                        fragPromise
                ]).then(function(values) {
                    // Done loading them
    
                    // Construct a new shader program from values
                    var shaderProgram = new Program(gl, values[0], values[1]);
    
                    // Deliver the shader program
                    onload(shaderProgram);
                });
            }
        });
    }());

## app.js ##

    requirejs.config({
        baseUrl : "js",
        paths : {
            domReady : "lib/domReady/domReady",
            glsl : "module/glsl/glsl"
        }
    });
    
    require([
            "domReady",
            "glsl!v:../res/shader!f:../res/shader"
    ], function(domReady, fragShader) {
        domReady(function() {
            // Predefine Variables
            var c = null, gl = null;
    
            // Get reference to our canvas
            c = document.getElementById("testCanvas");
    
            // Get an OpenGL Context
            gl = c.getContext("experimental-webgl");
    
            /*
             * I should have a constructed and compiled shader here referenced by
             * fragShader
             */
    
            // Doesn't work yet
            gl.useProgram(fragShader);
    
        });
    });

# Answer

How about putting the canvas / webgl context in its own module

    // gl.js
    define(function() {
      var canvas = document.createElement("canvas");
      var gl = canvas.getContext("webgl");
      return gl;
    });

Now make every other module that needs webgl use that module

    define(['./gl'], function(gl) {
      // access the webgl context with
      gl.clearColor(1,0,0,1);
      // access the canvas
      gl.canvas.width = 150;
    });

[Here's an example](http://greggman.com/downloads/examples/require-gl/index.html). You can see the `gl.js` is included only once even though it is referenced by 6 different files.

