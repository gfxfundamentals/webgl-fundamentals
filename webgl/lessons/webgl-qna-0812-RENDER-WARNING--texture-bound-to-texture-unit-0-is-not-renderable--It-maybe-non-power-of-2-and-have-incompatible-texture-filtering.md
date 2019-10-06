Title: RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering
Description:
TOC: qna

# Question:

So i'm trying to use WebGL to offload some of the data processing needed for the image later.

I have two stages, first I'm trying 'render' unsigned ints to a texture.
On the second pass, I read from this texture and render to the canvas.

If i define the texture as RGBA than I have no problems. But when I change the format to RGBA32UI, I keep getting:


    RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering


I reduced my shaders to a single pixel and still getting the same error. 

Texture is initialized like this : 

    var texture = gl.createTexture();
    
    gl.activeTexture(gl.TEXTURE0 + 0);
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    {
      var level = 0;
      var internalFormat = gl.RGBA32UI;
      var border = 0;
      var format = gl.RGBA_INTEGER;
      var type = gl.UNSIGNED_INT;
      var data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        1, 1, border, format, type, data);
    
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    
    var level = 0;
    var attachmentPoint = gl.COLOR_ATTACHMENT1;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, level);

and inside the fragment shader I have two color types :

    layout(location = FLOAT_COLOR_LOCATION) out vec4 float_color;
    layout(location = UINT_COLOR_LOCATION) out uvec4 uint_color;


Thanks for the help! 




# Answer

The issue is you're using COLOR_ATTACHMENT1 and skipping COLOR_ATTACHMENT0.

IIRC you need to start at attachment 0 and work your way up.

Also you should probably be checking the framebuffer is complete with `gl.checkFramebufferStatus`

Also, integer textures are not filterable so you need to change `gl.LINEAR` to `gl.NEAREST`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl2");

    testAttachment(gl.COLOR_ATTACHMENT1);
    testAttachment(gl.COLOR_ATTACHMENT0);

    function testAttachment(attachmentPoint) {

      function createTexture() {
        var texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        var level = 0;
        var internalFormat = gl.RGBA32UI;
        var border = 0;
        var format = gl.RGBA_INTEGER;
        var type = gl.UNSIGNED_INT;
        var data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
          1, 1, border, format, type, data);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
      }
      
      var texture = createTexture();

      var fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

      var level = 0;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, level);

      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

      console.log(glEnumToString(gl, attachmentPoint), glEnumToString(gl, status));
      
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        return;
      }
      
      const vs = `#version 300 es
      void main() {
         gl_Position = vec4(0,0,0,1);
         gl_PointSize = 100.0;
      }
      `;
      const fs = `#version 300 es
      uniform highp usampler2D color;
      out uvec4 outColor;
      void main() {
        outColor = texture(color, gl_PointCoord);
      }
      `;
      
      const prg = twgl.createProgram(gl, [vs, fs]);
      gl.useProgram(prg);
      
      // need a different input texture than output texture
      const inTex = createTexture();
      
      // no need to set uniforms since they default to 0
      // so using texture unit 0
      gl.drawArrays(gl.POINTS, 0, 1);

      // check that it rendered without error
      console.log(glEnumToString(gl, gl.getError()));
    }

    function glEnumToString(gl, value) {
      if (value === 0) { 
        return "NONE";
      }
      for (let key in gl) {
        if (gl[key] === value) {
          return key;
        }
      }
      return "0x" + value.toString(16);
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->


