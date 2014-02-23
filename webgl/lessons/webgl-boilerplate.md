Title: WebGL Boilerplate

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

<pre class="prettyprint showlinemods">
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
</pre>

And the boilerplate code for linking 2 shaders into a program

<pre class="prettyprint showlinemods">
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
      throw ("program filed to link:" + gl.getProgramInfoLog (program));
  }

  return program;
};
</pre>

Of course how you decide to handle errors might be different.  Throwing
exceptions might not be the best way to handle things.  Still, those few
lines of code are the pretty much the same in nearly every WebGL program.

I like store my shaders in non javascript &lt;script&gt; tags.  It makes
them easy to edit so I use code like this.

<pre class="prettyprint showlinemods">
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
</pre>

Now to compile a shader I can just do

<pre class="prettyprint showlinemods">
var shader = compileShaderFromScriptTag(gl, "someScriptTagId");
</pre>

I'll usually go one step further and make a function to compile to shaders
from script tags, attach them to a program and link them.

<pre class="prettyprint showlinemods">
/**
 * Creates a program from 2 script tags.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} vertexShaderId The id of the vertex shader script tag.
 * @param {string} fragmentShaderId The id of the fragment shader script tag.
 * @return {!WebGLProgram} A program
 */
function createProgramFromScriptTags(
    gl, vertexShaderId, fragmentShaderId) {
  var vertexShader = createShaderFromScriptTag(gl, vertexShaderId);
  var fragmentShader = createShaderFromScriptTag(gl, fragmentShaderId);
  return createProgram(gl, vertexShader, fragmentShader);
}
</pre>

There's a couple of other pieces I've needed in most WebGL samples.

One is <a href="http://paulirish.com/2011/requestanimationframe-for-smart-animating/">Paul
Irish's requestAnimationFrame polyfill</a>.  The other is some code to
initialize WebGL.  At the time of this writing WebGL requires the asking
for an "experimental-webgl" context where as in the near future you can
just ask for "webgl".  I could write this in every WebGL program

<pre class="prettyprint showlinemods">
   ...
   var gl = canvas.getContext("experimental-webgl");
   if (!gl) {
     gl = canvas.getContext("webgl");
   }
   ...
</pre>

But I prefer to use some function I've written before.

That's most of my minmum set of WebGL boilerplate code.  <a
href="http://github.com/greggman/webgl-fundamentals/">You can find that
code here</a>.

The rest of what makes WebGL look complicated is setting up all the inputs
to your shaders.  See <a href="webgl-how-it-works.html">how it works</>.



