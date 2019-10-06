Title: Are my GLSL shader programs optimized by the browser or driver?
Description:
TOC: qna

# Question:

In a recent project of mine, I procedurally create fragment shaders that look like this (but possibly larger), which I display using WebGL:

    precision mediump float;
    uniform vec2 u_windowSize;
    void main() {
      float s = 2.0 / min(u_windowSize.x, u_windowSize.y);
      vec2 pos0 = s * (gl_FragCoord.xy - 0.5 * u_windowSize);
      if (length(pos0) > 1.0) { gl_FragColor = vec4(0,0,0,0); return; }
      vec2 pos1 = pos0/0.8;
      vec2 pos2 = ((1.0-length(pos1))/length(pos1)) * pos1;
      vec3 col2 = vec3(1.0,1.0,1.0);
      vec2 pos3 = pos2;
      vec3 col3 = vec3(1.0,0.0,0.0);
      vec2 tmp2 = 6.0*(1.0/sqrt(2.0)) * mat2(1.0,1.0,-1.0,1.0) * pos2;
      vec3 col4;
      if (mod(tmp2.x, 2.0) < 1.0 != mod(tmp2.y, 2.0) < 1.0) {
         col4 = col2;
      } else {
         col4 = col3;
      };      
      vec2 pos5 = pos0;
      vec3 col5 = vec3(0.0,1.0,1.0);
      vec3 col6;
      if (length(pos0) < 0.8) {
         col6 = col4;
      } else {
         col6 = col5;
      };
      gl_FragColor = vec4(col6, 1.0);
    }

Obviously there is some redundancy here that you would not write by hand – copying `pos2` into `pos3` is pointless, for example. But since I generate this code, this is convenient.

Before I now prematurely start optimizing and make my generator produce hopefully more efficient code, I’d like to know:

Do browsers and/or graphics drivers already optimize such things (so I don't have to)?

# Answer

There is no requirement for the browser to do any optimization. You can see what the browser is sending to the driver by using the `WEBGL_debug_shaders` extension. 

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl.getExtension('WEBGL_debug_shaders');
    const vs = `
    attribute vec4 position;
    uniform mat4 matrix;

    void main() {
      float a = 1. + 2. * 3.;  // does this get optimized to 7?
      float b = a;             // does this get discarded?
      gl_Position = matrix * position * vec4(b, a, b, a);
    }
    `;

    const s = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(s, vs);
    gl.compileShader(s);
    console.log(ext.getTranslatedShaderSource(s));

<!-- end snippet -->

On my machine/driver/browser that returns this result

    #version 410
    in vec4 webgl_74509a83309904df;
    uniform mat4 webgl_5746d1f3d2c2394;
    void main(){
    (gl_Position = vec4(0.0, 0.0, 0.0, 0.0));
    float webgl_2420662cd003acfa = 7.0;
    float webgl_44a9acbe7629930d = webgl_2420662cd003acfa;
    (gl_Position = ((webgl_5746d1f3d2c2394 * webgl_74509a83309904df) * vec4(webgl_44a9acbe7629930d, webgl_2420662cd003acfa, webgl_44a9acbe7629930d, webgl_2420662cd003acfa)));
    }

We can see in this case the simple constant math was optimized but the fact that `a` an `b` are the same were not. That said there is no guarantee that other browsers would make this optimization.

Whether or not drivers optimize is up to the driver. Most drivers will at least do a little optimization but full optimization takes time. DirectX can take > 5 minutes to optimize a single complex shader with full optimization on so optimization is probably something that should be [done offline](https://www.google.com/search?q=javascript+glsl+optimizer). In the DirectX case you're expected to save the binary shader result to avoid the 5 minutes the next time the shader is needed but for WebGL that's not possible as binary shaders would be both not portable and a security issue. Also having the browser freeze for a long time waiting for the compile would also be unacceptable so browsers can't ask DirectX for full optimization. That said, some browser cache binary shader results behind the scenes.
