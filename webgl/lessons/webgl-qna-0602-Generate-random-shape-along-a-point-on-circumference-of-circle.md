Title: Generate random shape along a point on circumference of circle
Description:
TOC: qna

# Question:

I am new to webgl ,i created a circle from vertices generated in a loop and i want a random shape(small circle) to be generated on some point along the circumference of the big circle.Can anyone provide me some info on how i can acheive this
Here is my code for the circle:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vertexShaderText = [
      'uniform vec2 u_resolution;',
      '',
      'attribute vec2 a_position;',
      '',
      'void main()',
      '{',
      '',
      'vec2 clipspace = a_position / u_resolution * 1.0 ;',
      '',
      'gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);',
      '}'
    ].join("\n");
    var fragmentShaderText = [
      'precision mediump float;',
      '',
      'void main(void)',
      '{',
      '',
      'gl_FragColor = vec4(0, 0, 0, 1.0);',
      '',
      '}'

    ].join("\n");
    var uni = function(){
      var canvas = document.getElementById("game-surface");
      var gl = canvas.getContext("webgl",{antialias: true});
      console.log("This is working");

      gl.clearColor(0.412,0.412,0.412,1);
      gl.clear(gl.COLOR_BUFFER_BIT);


      var vertextShader = gl.createShader(gl.VERTEX_SHADER);
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

      gl.shaderSource(vertextShader,vertexShaderText);
      gl.shaderSource(fragmentShader,fragmentShaderText);

      gl.compileShader(vertextShader);
      gl.compileShader(fragmentShader);

      if(!gl.getShaderParameter(vertextShader,gl.COMPILE_STATUS)){
        console.error("Error with vertexshader",gl.getShaderInfoLog(vertextShader));
        return;
      }
      if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
        console.error("Error with fragmentShader",gl.getShaderInfoLog(fragmentShader));
        return;
      }



      var program =gl.createProgram();
      gl.attachShader(program,vertextShader);
      gl.attachShader(program,fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
        console.error("Error linking program",gl.getProgramInfoLog(program));
        return;
      }
      gl.validateProgram(program);
      if(!gl.getProgramParameter(program,gl.VALIDATE_STATUS)){
        console.error("Error validating",gl.getProgramInfoLog(program));
      }

      var circle = {x: 0, y:0, r: 55};
      var ATTRIBUTES = 2;
      var numFans = 32;
      var degreePerFan = (2* Math.PI) / numFans;
      var vertexData = [circle.x, circle.y];

      for(var i = 0; i <= numFans; i++) {
        var index = ATTRIBUTES * i + 2; // there is already 2 items in array
        var angle = degreePerFan * (i+0.1);
        vertexData[index] = circle.x + Math.cos(angle) * circle.r;
        vertexData[index + 1] = circle.y + Math.sin(angle) * circle.r;
      }
      console.log(vertexData);
      var vertexDataTyped = new Float32Array(vertexData);

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertexDataTyped, gl.STATIC_DRAW);

      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      gl.enableVertexAttribArray(positionLocation);

      var positionLocation = gl.getAttribLocation(program, "a_position");
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexData.length/ATTRIBUTES);
    };
    uni();


<!-- language: lang-html -->

    <canvas id="game-surface"></canvas>

<!-- end snippet -->



# Answer

It's hard to answer your question because WebGL is just a rasterization library so there's literally 1000s of ways to draw something somewhere.

So, you can

* add more points

  You generated the circle points. Generate some more for whatever else you want to draw.

* draw the same circle multiple times in different places and sizes

  Let's say you wanted to draw a small circle on the big circle. [Compute a matrix to scale and reorient](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) the big circle [where you want it to be](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html), update the matrix, draw the circle again.

* draw more things

  Just like you drew the circle, draw something else like a square and position it at the edge of the circle.

* 1000 more ways...


