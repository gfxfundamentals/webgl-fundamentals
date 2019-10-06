Title: xtk renderer3D's pick() produce errors in webgl2 enabled browsers
Description:
TOC: qna

# Question:

Has anyone used xtk with webgl2 to do the pick() call? specifically
renderer3d's. 

Error: WebGL: drawArrays: Feedback loop detected...renderer3D.js:1977:7

Error: WebGL: readPixels: Out-of-bounds reads with readPixels are deprecated, and may be slow.  renderer3D.js:1445:5


# Answer

For the first error, feedback loops have always been invalid and an error in WebGL. From the [WebGL 1 spec section 6.26](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.26)

> ## 6.26 Feedback Loops Between Textures and the Framebuffer

> In the OpenGL ES 2.0 API, it's possible to make calls that both write to and read from the same texture, creating a feedback loop. It specifies that where these feedback loops exist, undefined behavior results.

> In the WebGL API, such operations that would cause such feedback loops (by the definitions in the OpenGL ES 2.0 spec) will instead generate an INVALID_OPERATION error.

As for the 2nd error that's not a valid WebGL error. Which version of which browser is generating that error?

Here's the WebGL conformance test to make sure you can read out of bounds

https://www.khronos.org/registry/webgl/sdk/tests/conformance/reading/read-pixels-test.html?webglVersion=1&quiet=0

And here's a snippet showing reading out of bounds does not generate an error.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    ['webgl', 'webgl2'].forEach(check);

    function check(version) {
      log(`checking ${version}`);
      
      const gl = document.createElement("canvas").getContext(version);
      if (!gl) {
        log(`${version} not supported`);
        return;
      }
      const pixel = new Uint8Array(4);
      // read off the left bottom
      gl.readPixels(-10, -10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      // read off the right top
      gl.readPixels(400, 300, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      //
      const error = gl.getError();
      log(error ? `error was ${error} reading out of bounds` 
                : "there were no errors reading out of bounds");
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join();
      document.body.appendChild(elem);
    }


<!-- end snippet -->

[Maybe file bugs with xtk](https://github.com/xtk/X/issues)?

