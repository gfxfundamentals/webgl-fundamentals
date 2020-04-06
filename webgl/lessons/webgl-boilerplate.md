Title: WebGL Boilerplate
Description: Some of the code you need for all WebGL programs
TOC: Boilerplate


This is a continuation from <a href="webgl-fundamentals.html">WebGL Fundamentals</a>.
WebGL sometimes appears complicated to learn because most lessons
go over everything all at once. I'll try to avoid that where possible
and break it down into smaller pieces.

One of things that makes WebGL seem complicated is that you have these 2
tiny functions, a vertex shader and a fragment shader.  Those two
functions usually run on your GPU which is where all the speed comes from.
That's also why they are written in a custom language, a language that
matches what a GPU can do.  Those 2 functions need to be compiled and
linked.  That process is, 99% of the time, the same in every WebGL
program.

Here's the boilerplate code for compiling a shader.

    /**
     * Creates and compiles a shader.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string} shaderSource The GLSL source code for the shader.
     * @param {number} shaderType The type of shader, VERTEX_SHADER or
     *     FRAGMENT_SHADER.
     * @return {!WebGLShader} The shader.
     */
    function compileShader(gl, shaderSource, shaderType) {
      // Create the shader object
      var shader = gl.createShader(shaderType);

      // Set the shader source code.
      gl.shaderSource(shader, shaderSource);

      // Compile the shader
      gl.compileShader(shader);

      // Check if it compiled
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // Something went wrong during compilation; get the error
        throw "could not compile shader:" + gl.getShaderInfoLog(shader);
      }

      return shader;
    }

And the boilerplate code for linking 2 shaders into a program

    /**
     * Creates a program from 2 shaders.
     *
     * @param {!WebGLRenderingContext) gl The WebGL context.
     * @param {!WebGLShader} vertexShader A vertex shader.
     * @param {!WebGLShader} fragmentShader A fragment shader.
     * @return {!WebGLProgram} A program.
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // create a program.
      var program = gl.createProgram();

      // attach the shaders.
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // link the program.
      gl.linkProgram(program);

      // Check if it linked.
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
          // something went wrong with the link
          throw ("program failed to link:" + gl.getProgramInfoLog (program));
      }

      return program;
    };

Of course how you decide to handle errors might be different.  Throwing
exceptions might not be the best way to handle things.  Still, those few
lines of code are pretty much the same in nearly every WebGL program.

I like to store my shaders in non javascript &lt;script&gt; tags.  It makes
them easy to edit so I use code like this.

    /**
     * Creates a shader from the content of a script tag.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string} scriptId The id of the script tag.
     * @param {string} opt_shaderType. The type of shader to create.
     *     If not passed in will use the type attribute from the
     *     script tag.
     * @return {!WebGLShader} A shader.
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // look up the script tag by id.
      var shaderScript = document.getElementById(scriptId);
      if (!shaderScript) {
        throw("*** Error: unknown script element" + scriptId);
      }

      // extract the contents of the script tag.
      var shaderSource = shaderScript.text;

      // If we didn't pass in a type, use the 'type' from
      // the script tag.
      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          opt_shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          opt_shaderType = gl.FRAGMENT_SHADER;
        } else if (!opt_shaderType) {
          throw("*** Error: shader type not set");
        }
      }

      return compileShader(gl, shaderSource, opt_shaderType);
    };

Now to compile a shader I can just do

    var shader = compileShaderFromScript(gl, "someScriptTagId");

I'll usually go one step further and make a function to compile two shaders
from script tags, attach them to a program and link them.

    /**
     * Creates a program from 2 script tags.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string[]} shaderScriptIds Array of ids of the script
     *        tags for the shaders. The first is assumed to be the
     *        vertex shader, the second the fragment shader.
     * @return {!WebGLProgram} A program
     */
    function createProgramFromScripts(
        gl, shaderScriptIds) {
      var vertexShader = createShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

The other piece of code I use in almost every WebGL program is something to
resize the canvas. You can see [how that function is implemented here](webgl-resizing-the-canvas.html).

In the case of all the samples these 2 functions are included with

    <script src="resources/webgl-utils.js"></script>

and used like this

    var program = webglUtils.createProgramFromScripts(
      gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

It seems best not to clutter all the samples with many lines of the same code
as they just get in the way of what that specific example is about.

That's most of my minimum set of WebGL boilerplate code.
[You can find `webgl-utils.js` code here](../resources/webgl-utils.js).
If you want something slightly more organized check out [TWGL.js](https://twgljs.org).

The rest of what makes WebGL look complicated is setting up all the inputs
to your shaders.  See <a href="webgl-how-it-works.html">how it works</a>.

I'd also suggest you read up on [less code more fun](webgl-less-code-more-fun.html) and check out [TWGL](https://twgljs.org).

Note while we're add it there are several more scripts for similar reasons

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    This provides code to setup sliders that have a visible value that updates when you drag the slider.
    Again I didn't want to clutter all the files with this code so it's in one place.

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    This script is not needed except on webglfundamentals.org. It helps print error messages to
    the screen when used inside the live editor among other things.

*   [`m3.js`](../resources/m3.js)

    This is a bunch of 2d math functions. They get created started with the first article about
    matrix math and as they are created they are inline but eventually they're just too much clutter
    so after few example they are used by including this script.

*   [`m4.js`](../resources/m4.js)

    This is a bunch of 3d math functions. They get created started with the first article about 3d
    and as they are created they are inline but eventually they're just too much clutter so after
    the 2nd article on 3d they are used by including this script.



