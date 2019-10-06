Title: How to use the OES_texture_float extension? and create a texture as a floating point one for that?
Description:
TOC: qna

# Question:

How to use the OES_texture_float extension? 
  and create a texture as a floating point one for that?


As webGL 1 extension lists:

      var ext = gl.getExtension("OES_texture_float");
      var linear =  gl.getExtension("OES_texture_float_linear");
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, image);

How to make a float-point image as a texture input?




# Answer

First off you're not actually checking you got the extension

Your code should be something like

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       alert("this machine or browser does not support OES_texture_float");
    }   
    var linear =  gl.getExtension("OES_texture_float_linear");
    if (!linear) {
       alert("this machine or browser does not support  OES_texture_float_linear");
    }


Otherwise you didn't show enough code to see what else might be wrong. Have you read any [webgl tutorials](http://webglfundamentals.org)? Where are you creating and binding the texture? What do your shaders look like? What kind of attributes are you using if any?

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      var gl = document.querySelector("canvas").getContext("webgl");
      var ext = gl.getExtension("OES_texture_float");
      if (!ext) {
        alert("this machine or browser does not support OES_texture_float");
        return;
      }   
      var linear = gl.getExtension("OES_texture_float_linear");
      if (!linear) {
        alert("this machine or browser does not support  OES_texture_float_linear");
        return;
      }

      var vs = `
    void main() {
      gl_PointSize = 100.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;

      var fs = `
    precision mediump float;
    uniform sampler2D u_tex;
    void main () {
      gl_FragColor = texture2D(u_tex, gl_PointCoord);
    }
    `;

      var program = twgl.createProgramFromSources(gl, [vs, fs]);

      // let's use a canvas instead of an image. It should be the same
      var image = document.createElement("canvas"); 
      var ctx = image.getContext("2d");
      for (var i = 20; i > 0; --i) {
        ctx.fillStyle = i % 2 ? "red" : "yellow";
        ctx.beginPath();
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, i * 20, 0, Math.PI * 2, false);
        ctx.fill();
      }

      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, image);

      gl.useProgram(program);
      gl.drawArrays(gl.POINTS, 0, 1);
    }
    main();


<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Also it's not clear what you mean by "create a texture as a floating point one for that". If the features are supported then uploading the image it will get converted to floating point (which we see in the example above) but the input image is an 8bit image at best. If you really want floating point data you'll have to use binary data rather than an image.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      var gl = document.querySelector("canvas").getContext("webgl");
      var ext = gl.getExtension("OES_texture_float");
      if (!ext) {
        alert("this machine or browser does not support OES_texture_float");
        return;
      }   
      var linear = gl.getExtension("OES_texture_float_linear");
      if (!linear) {
        alert("this machine or browser does not support  OES_texture_float_linear");
        return;
      }

      var vs = `
    void main() {
      gl_PointSize = 100.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;

      var fs = `
    precision mediump float;
    uniform sampler2D u_tex;
    void main () {
      gl_FragColor = texture2D(u_tex, gl_PointCoord) / vec4(32, 16, 32 + 16, 1);
    }
    `;

      var program = twgl.createProgramFromSources(gl, [vs, fs]);

      // create floating point data directly
      var width = 32;
      var height = 16;
      var data = new Float32Array(width * height * 4);  // RGBA
      for (y = 0; y < height; ++y) {
        for (x = 0; x < width; ++x) {
          var off = (y * width + x) * 4;
          data[off + 0] = x;
          data[off + 1] = y;
          data[off + 2] = x + y;
          data[off + 3] = 1;
        }
      }

      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);

      gl.useProgram(program);
      gl.drawArrays(gl.POINTS, 0, 1);
    }
    main();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


