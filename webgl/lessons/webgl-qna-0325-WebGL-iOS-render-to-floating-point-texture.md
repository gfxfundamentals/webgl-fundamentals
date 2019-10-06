Title: WebGL iOS render to floating point texture
Description:
TOC: qna

# Question:

I'm trying to get rendering to a floating point texture working in WebGL on iOS Safari (not in a native app). I have managed to get iOS to read a manually (e.g. from JavaScript) created floating point texture, however when I create a framebuffer of floating point type and use the GPU to render into it, it does not work.

I've isolated the issue to code that renders to a floating point texture, which is then passed to another shader to be displayed. Here is what the result looks like applied to a cube:

<img src="https://github.com/felixpalmer/render-2-texture/raw/master/rtt.png">

The render to texture draws a green square, half the size of the texture, which is then applied to each side of the cube.

This all works perfectly fine on both desktop and iOS WebGL as long as the type of the texture that the green square is rendered to is the standard unsigned byte type. However, changing the type to floating point causes the render to texture to fail on iOS devices (while continuing to work on desktop browsers). The texture is empty, as if nothing had been rendered to it.

I have created an example project here to demonstrate the issue: https://github.com/felixpalmer/render-2-texture

Changing the precision of the shaders using the `THREE.Renderer.precision` setting does not make a difference

# Answer

As far as I know no iOS device supports rendering to a floating point texture (nor do most mobile devices at this point in time 3/2015)

My understanding of the WebGL spec is

`OES_texture_float`: Allows you to create and read from 32bit float textures but rendering to a floating point is device dependent.

`OES_texture_float_linear`: Allows linear filter floating point textures. If this doesn't exist and `OES_texture_float` does then you can only use `gl.NEAREST` for floating point textures.

`OES_texture_half_float` and `OES_texture_half_float_linear` are the same as above except for half float textures.

The traditional way to see if you can render to a floating point texture in WebGL, assuming `OES_texture_float` exists, is to create a framebuffer, attach a floating point texture to it, then call `gl.checkFramebufferStatus`. If it returns `gl.FRAMEBUFFER_COMPLETE` then you can, if not then you can't. Note: This method should work regardless of the next paragraph.

The spec was updated so you could also check WebGL extensions to find out if it's possible to render to a floating point texture. The extension `WEBGL_color_buffer_float` is supposed to tell you you can render to floating point textures. The extension `EXT_color_buffer_half_float` is the same for half float textures. I know of no browser that actually shows these extensions though yet they support floating point rendering if the hardware supports it.

For example my 2012 Retina MBP on Chrome 41 reports

    gl = document.createElement("canvas").getContext("webgl").getSupportedExtensions()
    ["ANGLE_instanced_arrays", 
     "EXT_blend_minmax", 
     "EXT_frag_depth",  
     "EXT_shader_texture_lod",  
     "EXT_sRGB",  
     "EXT_texture_filter_anisotropic",  
     "WEBKIT_EXT_texture_filter_anisotropic",  
     "OES_element_index_uint",  
     "OES_standard_derivatives",  
     "OES_texture_float",  
     "OES_texture_float_linear",  
     "OES_texture_half_float",  
     "OES_texture_half_float_linear",  
     "OES_vertex_array_object",  
     "WEBGL_compressed_texture_s3tc",  
     "WEBKIT_WEBGL_compressed_texture_s3tc",  
     "WEBGL_debug_renderer_info",  
     "WEBGL_debug_shaders",  
     "WEBGL_depth_texture",  
     "WEBKIT_WEBGL_depth_texture",  
     "WEBGL_lose_context",  
     "WEBKIT_WEBGL_lose_context"]

Firefox 36 reports

    gl = document.createElement("canvas").getContext("webgl").getSupportedExtensions().join("\n")
    "ANGLE_instanced_arrays
    EXT_blend_minmax
    EXT_frag_depth
    EXT_sRGB
    EXT_texture_filter_anisotropic
    OES_element_index_uint
    OES_standard_derivatives
    OES_texture_float
    OES_texture_float_linear
    OES_texture_half_float
    OES_texture_half_float_linear
    OES_vertex_array_object
    WEBGL_compressed_texture_s3tc
    WEBGL_depth_texture
    WEBGL_draw_buffers
    WEBGL_lose_context
    MOZ_WEBGL_lose_context
    MOZ_WEBGL_compressed_texture_s3tc
    MOZ_WEBGL_depth_texture"

The browser vendors are busy implementing WebGL 2.0 and given the `gl.checkFramebufferStatus` method works there's no pressure to spend time making the other extension strings appear.

Apparently some iOS devices support `EXT_color_buffer_half_float` so you could try creating a half float texture, attach it to a framebuffer and check its status then see if that works.

Here's a sample to check support. Running it on my iPadAir2 and my iPhone5s I get

    can make floating point textures
    can linear filter floating point textures
    can make half floating point textures
    can linear filter floating point textures
    can **NOT** render to FLOAT texture
    successfully rendered to HALF_FLOAT_OES texture

which is exactly what we expected.

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";

    function log(msg) {
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(msg));
      document.body.appendChild(div);
    }                  

    function glEnum(gl, v) {
      for (var key in gl) {
        if (gl[key] === v) {
          return key;
        }
      }
      return "0x" + v.toString(16);
    }

    window.onload = function() {
      // Get A WebGL context
      var canvas = document.getElementById("c");
      var gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }
      
      
      function getExt(name, msg) {
        var ext = gl.getExtension(name);
        log((ext ? "can " : "can **NOT** ") + msg);
        return ext;
      }
      
      var testFloat = getExt("OES_texture_float", "make floating point textures");
      getExt("OES_texture_float_linear", "linear filter floating point textures");
      var testHalfFloat = getExt("OES_texture_half_float", "make half floating point textures");
      getExt("OES_texture_half_float_linear", "linear filter half floating point textures");
      
      gl.HALF_FLOAT_OES = 0x8D61;
      
      // setup GLSL program
      var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
      gl.useProgram(program);

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position"); 
      var colorLoc = gl.getUniformLocation(program, "u_color");

      // provide texture coordinates for the rectangle.
      var positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         -1.0, -1.0,
          1.0, -1.0,
         -1.0,  1.0,
         -1.0,  1.0,
          1.0, -1.0,
          1.0,  1.0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      var whiteTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, whiteTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                    new Uint8Array([255, 255, 255, 255]));
      
      function test(format) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, format, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          log("can **NOT** render to " + glEnum(gl, format) + " texture");
          return;
        }
        
        // Draw the rectangle.
        gl.bindTexture(gl.TEXTURE_2D, whiteTex);
        gl.uniform4fv(colorLoc, [0, 10, 20, 1]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        
        gl.clearColor(1, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.uniform4fv(colorLoc, [0, 1/10, 1/20, 1]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        var pixel = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        
        if (pixel[0] !== 0 ||
            pixel[1] < 248 ||
            pixel[2] < 248 ||
            pixel[3] < 254) {
          log("FAIL!!!: Was not able to actually render to " + glEnum(gl, format) + " texture");
        } else {
          log("succesfully rendered to " + glEnum(gl, format) + " texture");
        }    
      }
      if (testFloat) {
        test(gl.FLOAT);
      }
      if (testHalfFloat) {
        test(gl.HALF_FLOAT_OES);
      }
    }

<!-- language: lang-css -->

    canvas {
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <script src="//webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <canvas id="c" width="16" height="16"></canvas>  
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec4 a_position;

    void main() {
       gl_Position = a_position;
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
    uniform vec4 u_color;
    uniform sampler2D u_texture;

    void main() {
       gl_FragColor = texture2D(u_texture, vec2(0.5, 0.5)) * u_color;
    }
    </script>

<!-- end snippet -->


