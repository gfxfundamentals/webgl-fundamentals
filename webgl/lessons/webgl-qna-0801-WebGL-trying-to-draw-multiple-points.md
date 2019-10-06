Title: WebGL trying to draw multiple points
Description:
TOC: qna

# Question:

I'm trying to draw curve lines using Bezier, I try to do all in `void main()` and try to do with buffer, but it's wrong everywhere, and I don't understand where:

1) All in `main()`

    var VSHADER_SOURCE =
      'attribute vec2 a_Position;\n' +
      'void main() {\n' +
      '  gl_Position = a_Position;\n' +
      '  gl_PointSize = 10.0;\n' +
      '}\n';
    var FSHADER_SOURCE =
      'void main() {\n' +
      '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
        '}\n';
      function main() {  
       var canvas = document.getElementById('webgl');  
       var gl = getWebGLContext(canvas);
          if (!gl) 
     { 
      console.log('Failed to retrieve the <canvas> element');
      return; 
     } 
         if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
       {
      console.log('Failed to intialize shaders.');
      return;
       }
     gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT );
       w=(192*4);
     d=(w/1920);
     x=0.8;
     y=0.9
      var M = new Float32Array([-x,-y,-x+d,y,-x+2*d,-y,-x+3*d,y,-x+4*d,-y,]);
      var vertices=[]; 
    for (var i=0;i<6;i+=2)
     {
      for (var t=0 ;t<1;t+=0.01)
      {
      vertices.push((1-t)^2*M(i)+2*(1-t)*t*M(i+2)+t^2*M(i+4));
      vertices.push((1-t)^2*M(i+1)+2*(1-t)*t*M(i+3)+t^2*M(i+5));
      }
     }
           var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) 
        {
        console.log('Failed to get the storage location of a_Position');
        return -1;
        }
       for(var l = 0; l < lenght(nx)/2-1; l+=1) 
       {       
           gl.vertexAttrib2f(a_Position, vertices[l], vertices[l+1]); 
        gl.drawArrays(gl.POINTS, 0, 1);
       }
            gl.enableVertexAttribArray(a_Position);
    }
And second method I can't write because space is limited.

# Answer

Did you even attempt to debug this yourself? Like [open the JavaScript console and look for errors](https://developers.google.com/web/tools/chrome-devtools/console/)?

The code you posted isn't remotely runnable.

First off your shader

    attribute vec2 a_Position;
    void main() {
      gl_Position = a_Position;
      gl_PointSize = 10.0;
    }

won't compile and your framework (or whatever you call `initShaders`) should have printed an error that `gl_Position (a vec4) can not be assigned by a_Position, a vec2`. Change `a_Position` to a vec4.

Next up is these lines

       vertices.push((1-t)^2*M(i)+2*(1-t)*t*M(i+2)+t^2*M(i+4));
       vertices.push((1-t)^2*M(i+1)+2*(1-t)*t*M(i+3)+t^2*M(i+5));

`M` is not a function. I'm guessing you meant to use `M[expression]` not `M(expression)`

       vertices.push((1-t)^2*M[i]+2*(1-t)*t*M[i+2]+t^2*M[i+4]);
       vertices.push((1-t)^2*M[i+1]+2*(1-t)*t*M[i+3]+t^2*M[i+5]);

`^` is not the raise to a power operator in JavaScript [it's the bitwise xor operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Assignment_Operators#Bitwise_XOR_assignment). To raise a number to a power you use [`Math.pow`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow). So you probably wanted this

      vertices.push(Math.pow(1-t,2)*M[i]+2*(1-t)*t*M[i+2]+Math.pow(t,2)*M[i+4]);
      vertices.push(Math.pow(1-t,2)*M[i+1]+2*(1-t)*t*M[i+3]+Math.pow(t,2)*M[i+5]);

Then this line

        for(var l = 0; l < lenght(nx)/2-1; l+=1) 
 
There is no function `lenght` nor is there a function `length` in JavaScript nor did you declare a variable called `nx`

It seems like you wanted

        for(var l = 0; l < vertices.length; l += 2) 

You probably also want to use [multiline template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) for your shaders and your `initShader` function is very poorly written based on the fact that looking at your code you're accessnig `gl.program` which is not a thing.

At the end of the code you posted you have this line

    gl.enableVertexAttribArray(a_Position);

But that line only makes sense if you're using a buffer for your data. You're not. You're instead drawing one point at a time. You should use a buffer as it would be much much faster than calling `gl.drawArrays` once for each point 

Might I suggest some [other WebGL tutorials](https://webglfundamentals.org)?

Here's a working? version. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var VSHADER_SOURCE = `
      attribute vec4 a_Position;
      void main() {
        gl_Position = a_Position;
        gl_PointSize = 10.0;
      }
    `;
    var FSHADER_SOURCE = `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;

    function main() {  
      var canvas = document.getElementById('webgl');  
      var gl = canvas.getContext("webgl");
      if (!gl) 
      { 
        console.log('Failed to retrieve the <canvas> element');
        return; 
      } 
      if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
      {
        console.log('Failed to intialize shaders.');
        return;
      }
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      var w=(192*4);
      var d=(w/1920);
      var x=0.8;
      var y=0.9;
      var M = new Float32Array([-x,-y,-x+d,y,-x+2*d,-y,-x+3*d,y,-x+4*d,-y,]);
      var vertices=[]; 
      for (var i=0;i<6;i+=2)
      {
        for (var t=0;t<1;t+=0.01)
        {
          vertices.push(Math.pow(1-t,2)*M[i]+2*(1-t)*t*M[i+2]+Math.pow(t,2)*M[i+4]);
          vertices.push(Math.pow(1-t,2)*M[i+1]+2*(1-t)*t*M[i+3]+Math.pow(t,2)*M[i+5]);
        }
      }
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) 
      {
        console.log('Failed to get the storage location of a_Position');
        return -1;
      }
      for(var l = 0; l < vertices.length; l+=2) 
      {       
         gl.vertexAttrib2f(a_Position, vertices[l], vertices[l+1]); 
         gl.drawArrays(gl.POINTS, 0, 1);
      }
    }

    // THIS IS A POORLY WRITTEN FUNCTION!!!!
    // Normal WebGL pages use multiple shader programs
    // therefore you should **NEVER** assign values to 
    // the gl object!!!
    function initShaders(gl, vsrc, fsrc) {
      gl.program = twgl.createProgram(gl, [vsrc, fsrc]);
      gl.useProgram(gl.program);
      return !!gl.program;
    }

    main();


<!-- language: lang-css -->

    canvas { width: 384px; height: 216px; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas id="webgl" width="1920" height="1080"></canvas>

<!-- end snippet -->


