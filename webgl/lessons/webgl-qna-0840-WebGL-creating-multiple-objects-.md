Title: WebGL creating multiple objects?
Description:
TOC: qna

# Question:

So I am trying to create circles using the midpoint algorithm. I'm having trouble on how to handle buffers and basically get WebGL properly set up. Using the console I can see that the algorithm is working fine and making the vertex arrray, but I need help understanding what to do with the use.Program, createBuffers, drawArrays. Where should I place them?

Also, should I concat the circle everytime I call it in the START() function? 

like: circle(blah blah).concat(circle(blah blah));

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vertexShaderText = 
    [
    'precision mediump float;',
    '',
    'attribute vec2 vertPosition;',
    'attribute vec3 vertColor;',
    'varying vec3 fragColor;',
    '',
    'void main()',
    '{',
    '  fragColor = vertColor;',
    '  gl_Position = vec4(vertPosition, 0.0, 1.0);',
    '}'
    ].join('\n');

    var fragmentShaderText =
    [
    'precision mediump float;',
    '',
    'varying vec3 fragColor;',
    'void main()',
    '{',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
    ].join('\n');


    var START = function () {
      console.log('This is working');

      var canvas = document.getElementById('sky');
      var gl = canvas.getContext('webgl');

      if (!gl) {
        console.log('WebGL not supported, falling back on  experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
      }

      if (!gl) {
        alert('Your browser does not support WebGL');
      }

      gl.clearColor(.3, .3, .7, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      // Create shaders

      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      var fragmentShader = 
         gl.createShader(gl.FRAGMENT_SHADER);

      gl.shaderSource(vertexShader, vertexShaderText);
      gl.shaderSource(fragmentShader, fragmentShaderText);

      //create a program for the shaders
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

        var circle = function (xmid, ymid, r) {
      var points = [];
      var x = 0;
      var y = r;
      var pk = 5/4 - r;
      while (x < y)
      {
        if (pk < 0)
        {
          x++;
          pk += 2*x + 1;
        }
        else
        {
          x++;
          y--;
          pk += 2 * (x-y) + 1;
        }
        points.push(x+xmid, y+ymid);
        points.push(x+xmid, -y+ymid);
        points.push(-x+xmid, y+ymid);
        points.push(-x+xmid, -y+ymid);
        points.push(y+xmid, x+ymid);
        points.push(y+xmid, -x+ymid);
        points.push(-y+xmid, x+ymid);
        points.push(-y+xmid, -x+ymid);
      }

      var cbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), 
          gl.STATIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, points.length/2);

      var positionAttribLocation = gl.getAttribLocation(program, 
       'vertPosition');
      var colorAttribLocation = gl.getAttribLocation(program, 
       'vertColor');

      gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        2, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT, // Size of an  individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
      );

      gl.enableVertexAttribArray(positionAttribLocation);
      gl.enableVertexAttribArray(colorAttribLocation);

      return points;

      }

      circle(0.6, 0.6, 0.18);

      circle(0.9, 0.6, 0.18);

      circle(0.5, 0.4, 0.18);

      circle(1.0, 0.4, 0.18);

      circle(0.75, 0.4, 0.18);

      circle(0.75, 0.4, 0.18);


    }

    START();


<!-- language: lang-html -->

    <canvas id="sky"></canvas>

<!-- end snippet -->

This is what my console log is saying:

     6WebGL: INVALID_OPERATION: useProgram: program not 
     valid
     6WebGL: INVALID_OPERATION: drawArrays: no valid shader 
     program in use
     12WebGL: INVALID_OPERATION: getAttribLocation: program 
     not linked

You can clearly see that I am linking and using the program at the very beginning. So what gives?

# Answer

There's more than one issue with the code

1.  The shaders are not compiled

    After setting the shader source with `gl.shaderSource` you need
    to compile them with `gl.compileShader`. You should also
    be checking for errors by calling `gl.getShaderParameter(shader, gl.COMPILE_STATUS)`
    and you should be checking for errors after linking by calling
    `gl.getProgramParameter(program, gl.LINK_STATUS)`

2.  `gl.drawArrays` is called before setting the attributes

3.  The code is enabling 2 attributes but only supplying data for 1 attribute.

4.  The code is drawing `gl.POINTS` but the vertex shader is not setting `gl_PointSize`

I also don't really understand your circle code but since I don't know what it's really trying to do I can't *fix* it.

And finally you should probably read [some tutorials on WebGL](http://webglfundamentals.org)

I'd also suggest you use multiline template literals for your shaders

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vertexShaderText = `
    precision mediump float;

    attribute vec2 vertPosition;
    attribute vec3 vertColor;
    varying vec3 fragColor;

    void main()
    {
      fragColor = vertColor;
      gl_Position = vec4(vertPosition, 0.0, 1.0);
      gl_PointSize = 5.;
    }
    `;

    const fragmentShaderText = `
    precision mediump float;

    varying vec3 fragColor;
    void main()
    {
      gl_FragColor = vec4(fragColor, 1.0);
    }
    `;

    const start = function () {
      console.log('This is working');

      const canvas = document.getElementById('sky');
      const gl = canvas.getContext('webgl');

      if (!gl) {
        alert('Your browser does not support WebGL');
        return;
      }

      gl.clearColor(.3, .3, .7, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      //create a shader program 
      const program = createProgram(gl, vertexShaderText, fragmentShaderText);
      gl.useProgram(program);

      const circle = function (xmid, ymid, r) {
        const points = [];
        let x = 0;
        let y = r;
        let pk = 5/4 - r;
        while (x < y)
        {
          if (pk < 0)
          {
            x++;
            pk += 2*x + 1;
          }
          else
          {
            x++;
            y--;
            pk += 2 * (x-y) + 1;
          }
          points.push(x+xmid, y+ymid);
          points.push(x+xmid, -y+ymid);
          points.push(-x+xmid, y+ymid);
          points.push(-x+xmid, -y+ymid);
          points.push(y+xmid, x+ymid);
          points.push(y+xmid, -x+ymid);
          points.push(-y+xmid, x+ymid);
          points.push(-y+xmid, -x+ymid);
        }

        const cbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

        gl.vertexAttribPointer(
          positionAttribLocation, // Attribute location
          2, // Number of elements per attribute
          gl.FLOAT, // Type of elements
          gl.FALSE,
          0, // Size of an  individual vertex
          0 // Offset from the beginning of a single vertex to this attribute
        );

        gl.enableVertexAttribArray(positionAttribLocation);
        
        // you probably meant to supply colors for this attribute
        // since if you wanted a constant color you'd have probably
        // used a uniform but since you didn't we'll set a constant
        // color
        gl.vertexAttrib4f(colorAttribLocation, 1, 0, 0, 1);
        
        gl.drawArrays(gl.POINTS, 0, points.length/2);

        return points;

      }

      circle(0.6, 0.6, 0.18);
      circle(0.9, 0.6, 0.18);
      circle(0.5, 0.4, 0.18);
      circle(1.0, 0.4, 0.18);
      circle(0.75, 0.4, 0.18);
      circle(0.75, 0.4, 0.18);
    }

    function createProgram(gl, vertexShaderText, fragmentShaderText) {
      // Create shaders
      const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;  
    }

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    start();

<!-- language: lang-html -->

    <canvas id="sky"></canvas>

<!-- end snippet -->


