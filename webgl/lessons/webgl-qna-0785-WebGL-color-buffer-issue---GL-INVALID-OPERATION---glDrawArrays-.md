Title: WebGL color buffer issue: [GL_INVALID_OPERATION : glDrawArrays]
Description:
TOC: qna

# Question:

I am trying to get starting learning WebGL; I got my proof of concept working without color, but as soon as I tried added color by adding

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
    ), gl.STATIC_DRAW);
    
    ColorAttribute = gl.getAttribLocation(program, 'color');
    gl.enableVertexAttribArray(ColorAttribute);
    gl.vertexAttribPointer(ColorAttribute, 4, gl.FLOAT, false, 0, 0);

where 

- `gl` is the WebGLRenderingContext, 
- `program` is the successfully compiled program with a vertex and a fragment shader attached
- `colorBuffer`, `ColorAttribute` are null variables 

in the main code, and changing 

    gl_FragColor = vec4(0.2, 0.4, 0.6, 1);
to 

    gl_FragColor = vcolor;    

in the fragment shader source(commenting the shader body does not make the error go away); I got the following error:

> [.Offscreen-For-WebGL-0000000005BB7940]GL ERROR :GL_INVALID_OPERATION : glDrawArrays: attempt to access out of range vertices in attribute 1

Which is strange because my color buffer has 3 colors in it, one for each vertex of the triangle:

    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
    ), gl.STATIC_DRAW);

and my vertex buffer has 3 vertices in it:

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0, 0,
        0, 1, 0,
        1, 1, 0
    ]), gl.STATIC_DRAW);

I made sure that i set the item size of color buffer to 4, and item size of vertex buffer to 3 in my calls to `vertexAttribPointer`, so I am not sure what could be out of range.

Below is a code that works, with the color changes commented out, followed by one that doesn't work with color changes in. Both samples work by pasting into browser developer console on any window, but the screenshots were taken in "about:blank". 

Both snippets are self contained, but only tested in Chrome.

This is the working version:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    (function() {
        "use strict";

        var hWnd;
        var src_vertexShader;
        var src_fragmentShader;
        var canvas;
        var gl;
        var program;
        var vertexShader;
        var fragmentShader;
        var vertexBuffer;
        var colorBuffer;
        var PositionAttribute;
        var ColorAttribute;

        // | canvas container.
        hWnd = document.createElement("div");
        hWnd.style.position = "fixed";
        hWnd.style.top = "0px";
        hWnd.style.left = "0px";
        hWnd.style.border = "1px solid #000000";
        hWnd.addEventListener("click", function() {
            this.outerHTML = '';
        });

        // | vertex shader source.
        src_vertexShader = `
    attribute vec3 position;
    attribute vec4 color;

    varying vec4 vcolor;

    void main() {
        gl_Position = vec4(position, 1.0);
        vcolor = color;
    }`;

        // | fragment shader source.
        src_fragmentShader = `       
    varying lowp vec4 vcolor;

    void main() {
        gl_FragColor = vec4(0.2, 0.4, 0.6, 1);

        //gl_FragColor = vcolor;    
    }`;

        // | our WebGL canvas.
        canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 200;       

        // | our WebGLRenderingContext.
        gl = canvas.getContext('webgl', {antialias: false});

        // | setting up our program using a Vertex and a Fragment shader.
        program = gl.createProgram();
        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, src_vertexShader);
        gl.shaderSource(fragmentShader, src_fragmentShader);

        gl.compileShader(vertexShader);
        console.log('Shader compiled successfully: ' + gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS));
        console.log('Shader compiler log: ' + gl.getShaderInfoLog(vertexShader));    

        gl.compileShader(fragmentShader);
        console.log('Shader compiled successfully: ' + gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS));
        console.log('Shader compiler log: ' + gl.getShaderInfoLog(fragmentShader));    

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        console.log(gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS));    

        // | create and attach a vertex buffer with data for one triangle.
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 0,
            0, 1, 0,
            1, 1, 0
        ]), gl.STATIC_DRAW);

        PositionAttribute = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(PositionAttribute);
        gl.vertexAttribPointer(PositionAttribute, 3, gl.FLOAT, false, 0, 0);

        /*
        // | create and attach a color buffer with color data for our triangle.
        colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1,
        ), gl.STATIC_DRAW);

        ColorAttribute = gl.getAttribLocation(program, 'color');
        gl.enableVertexAttribArray(ColorAttribute);
        gl.vertexAttribPointer(ColorAttribute, 4, gl.FLOAT, false, 0, 0);
        */

        // | clear the screen.
        gl.clearColor(0.93, 0.93, 0.93, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // | draw the triangle.
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        hWnd.appendChild(canvas)
        document.body.appendChild(hWnd);
    })();


<!-- end snippet -->

[![enter image description here][1]][1]

This is the version that complains:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    (function() {
        "use strict";

        var hWnd;
        var src_vertexShader;
        var src_fragmentShader;
        var canvas;
        var gl;
        var program;
        var vertexShader;
        var fragmentShader;
        var vertexBuffer;
        var colorBuffer;
        var PositionAttribute;
        var ColorAttribute;

        // | canvas container.
        hWnd = document.createElement("div");
        hWnd.style.position = "fixed";
        hWnd.style.top = "0px";
        hWnd.style.left = "0px";
        hWnd.style.border = "1px solid #000000";
        hWnd.addEventListener("click", function() {
            this.outerHTML = '';
        });

        // | vertex shader source.
        src_vertexShader = `
    attribute vec3 position;
    attribute vec4 color;

    varying vec4 vcolor;

    void main() {
        gl_Position = vec4(position, 1.0);
        vcolor = color;
    }`;

        // | fragment shader source.
        src_fragmentShader = `       
    varying lowp vec4 vcolor;

    void main() {
        gl_FragColor = vcolor;    
    }`;

        // | our WebGL canvas.
        canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 200;       

        // | our WebGLRenderingContext.
        gl = canvas.getContext('webgl', {antialias: false});

        // | setting up our program using a Vertex and a Fragment shader.
        program = gl.createProgram();
        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, src_vertexShader);
        gl.shaderSource(fragmentShader, src_fragmentShader);

        gl.compileShader(vertexShader);
        console.log('Shader compiled successfully: ' + gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS));
        console.log('Shader compiler log: ' + gl.getShaderInfoLog(vertexShader));    

        gl.compileShader(fragmentShader);
        console.log('Shader compiled successfully: ' + gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS));
        console.log('Shader compiler log: ' + gl.getShaderInfoLog(fragmentShader));    

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        console.log(gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS));    

        // | create and attach a vertex buffer with data for one triangle.
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 0,
            0, 1, 0,
            1, 1, 0
        ]), gl.STATIC_DRAW);

        PositionAttribute = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(PositionAttribute);
        gl.vertexAttribPointer(PositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // | create and attach a color buffer with color data for our triangle.
        colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1,
        ), gl.STATIC_DRAW);

        ColorAttribute = gl.getAttribLocation(program, 'color');
        gl.enableVertexAttribArray(ColorAttribute);
        gl.vertexAttribPointer(ColorAttribute, 4, gl.FLOAT, false, 0, 0);

        // | clear the screen.
        gl.clearColor(0.93, 0.93, 0.93, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // | draw the triangle.
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        hWnd.appendChild(canvas)
        document.body.appendChild(hWnd);    
    })();

<!-- end snippet -->


[![enter image description here][2]][2]

[![enter image description here][3]][3]

Thanks ahead of time.


  [1]: https://i.stack.imgur.com/GHtGW.png
  [2]: https://i.stack.imgur.com/8da0F.png
  [3]: https://i.stack.imgur.com/nBUEp.png

# Answer

The issue is the code is missing square brackets when defining the colors

     gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
      ), gl.STATIC_DRAW);

vs this

     gl.bufferData (gl.ARRAY_BUFFER, new Float32Array([
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
     ]), gl.STATIC_DRAW);

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    (function() {
        "use strict";

        var hWnd;
        var src_vertexShader;
        var src_fragmentShader;
        var canvas;
        var gl;
        var program;
        var vertexShader;
        var fragmentShader;
        var vertexBuffer;
        var colorBuffer;
        var PositionAttribute;
        var ColorAttribute;

        // | canvas container.
        hWnd = document.createElement("div");
        hWnd.style.position = "fixed";
        hWnd.style.top = "0px";
        hWnd.style.left = "0px";
        hWnd.style.border = "1px solid #000000";
        hWnd.addEventListener("click", function() {
            this.outerHTML = '';
        });

        // | vertex shader source.
        src_vertexShader = `
    attribute vec3 position;
    attribute vec4 color;

    varying vec4 vcolor;

    void main() {
        gl_Position = vec4(position, 1.0);
        vcolor = color;
    }`;

        // | fragment shader source.
        src_fragmentShader = `       
    varying lowp vec4 vcolor;

    void main() {
        gl_FragColor = vcolor;    
    }`;

        // | our WebGL canvas.
        canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 200;       

        // | our WebGLRenderingContext.
        gl = canvas.getContext('webgl', {antialias: false});

        // | setting up our program using a Vertex and a Fragment shader.
        program = gl.createProgram();
        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, src_vertexShader);
        gl.shaderSource(fragmentShader, src_fragmentShader);

        gl.compileShader(vertexShader);
        console.log('Shader compiled successfully: ' + gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS));
        console.log('Shader compiler log: ' + gl.getShaderInfoLog(vertexShader));    

        gl.compileShader(fragmentShader);
        console.log('Shader compiled successfully: ' + gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS));
        console.log('Shader compiler log: ' + gl.getShaderInfoLog(fragmentShader));    

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        console.log(gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS));    

        // | create and attach a vertex buffer with data for one triangle.
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 0,
            0, 1, 0,
            1, 1, 0
        ]), gl.STATIC_DRAW);

        PositionAttribute = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(PositionAttribute);
        gl.vertexAttribPointer(PositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // | create and attach a color buffer with color data for our triangle.
        colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.bufferData (gl.ARRAY_BUFFER, new Float32Array([
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1,
        ]), gl.STATIC_DRAW);

        ColorAttribute = gl.getAttribLocation(program, 'color');
        gl.enableVertexAttribArray(ColorAttribute);
        gl.vertexAttribPointer(ColorAttribute, 4, gl.FLOAT, false, 0, 0);

        // | clear the screen.
        gl.clearColor(0.93, 0.93, 0.93, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // | draw the triangle.
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        hWnd.appendChild(canvas)
        document.body.appendChild(hWnd);    
    })();

<!-- end snippet -->


