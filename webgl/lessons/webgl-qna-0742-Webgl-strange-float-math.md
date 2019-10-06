Title: Webgl strange float math
Description:
TOC: qna

# Question:

One gets strange results when modifying values of float variables inside a conditional statement when a uniform or texture coordinates are used in the condition. This happens inside a fragment shader on numerous mobile devices like iPhone 4S, iPhone 5, iPhone 5S, iPhone 6 (Safari, Chrome and Firefox), Samsung J3 (Android browser, Chrome) and quite possibly others.
It seems the value can be compared to another float, but when is divided one gets zero if the divisor is more than half bigger than the value.
Here is a simple test case. All values of R, G and B colors are expected to be the same 128 and the output should be thus grey, however on these mobile devices one gets R equal to zero and so the output is of sea color.
The jsfiddle is [here][1]


The html is:

    <html>
 <head>
  <title>Hello</title>
 </head>
 <body>
  <script src="js/shadertest.js"></script>
 </body> 
</html>
The js code is:

        function test(){
     var create3DContext = function(canvas, opt_attribs) {
       var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
       var context = null;
       for (var ii = 0; ii < names.length; ++ii) {
      try {
        context = canvas.getContext(names[ii], opt_attribs);
      } catch(e) {}
      if (context) {
        break;
      }
       }
       return context;
     }
     
     var compileShader = function(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
       throw new Error(gl.getShaderInfoLog(shader));
      }
       
      return shader;
     };
     
     var canvas = document.createElement('canvas');
     canvas.width = 1;
     canvas.height = 1;
     canvas.style.width = '100%';
     canvas.style.height = '100%';
     document.body.appendChild(canvas);
     
     var gl = create3DContext(canvas, {});
     
     // init buffers
     var buffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    
     // The main IDWT Shader
     var webglProgram = gl.createProgram();
     gl.attachShader(webglProgram, compileShader(gl.VERTEX_SHADER, SHADER_VERTEX_IDENTITY));
     gl.attachShader(webglProgram, compileShader(gl.FRAGMENT_SHADER, SHADER_FRAGMENT));
     
     gl.linkProgram(webglProgram);
     
     
     
     if( !gl.getProgramParameter(webglProgram, gl.LINK_STATUS) ) {
      throw new Error(gl.getProgramInfoLog(webglProgram));
     }
     
     gl.useProgram(webglProgram);
     
     
     var vertexAttr = gl.getAttribLocation(webglProgram, 'vertex');
     gl.enableVertexAttribArray(vertexAttr);
     gl.vertexAttribPointer(vertexAttr, 2, gl.FLOAT, false, 0, 0);
     
     gl.uniform1i(gl.getUniformLocation(webglProgram, 'vertical'), 0);
     
     gl.viewport(0, 0, 1, 1);
      
     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
     
     var pixels = new Uint8Array(4);
     var imgData = gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE, pixels);
     console.log('R = '+pixels[0]);
     console.log('G = '+pixels[1]);
     console.log('B = '+pixels[2]);
     console.log('A = '+pixels[3]);
    }
    var SHADER_FRAGMENT = [
     
      'precision mediump float;',
      
      'uniform int vertical;',
      
      'void main() {',
       'float valueLow  = 60.0;',
       'float valueHigh = 60.0;',
       'if ( vertical == 1)',
       '{',
        'valueLow = 60.0;',
       '}',
       'gl_FragColor.rgba = vec4((valueLow+10000.0)/20000.0, (valueHigh+10000.0)/20000.0, (60.0+10000.0)/20000.0, 1.0);',
      '}'
     ].join('\n'),
    SHADER_VERTEX_IDENTITY = [
     'attribute vec2 vertex;',
     'varying vec2 texCoord;',
     
     'void main() {',
      'texCoord = vertex;',
      'gl_Position = vec4((vertex * 2.0 - 1.0) * vec2(1, -1), 0.0, 1.0);',
     '}'
    ].join('\n');
    test();
**EDIT**
I found one workaround which is to move the math with the variable in question inside the same conditional statement like in this [jsfiddle][2], but I hope there is a more elegant way.


  [1]: https://jsfiddle.net/d4waymcL/
  [2]: https://jsfiddle.net/zfas53c8/

# Answer

I don't know how to work around low percision issues except to change your math not to run into the but you can conditionally ask for high percision

    #if GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #else

Most modern phones support highp at the expense of speed but some older ones like an iPhone3GS don't.

You can also set the precision of specific variables

    #if GL_FRAGMENT_PRECISION_HIGH
      highp vec3 someVar;
    #else
      mediump vec3 someVar;
    #else

On desktop you just always get highp regardless of what you ask for which is fine as far as the spec in concerned. 
