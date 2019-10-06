Title: Passing color to fragment shader from javascript
Description:
TOC: qna

# Question:

I am currently learning webgl and have a question.
I am trying to make a triangle and passing the color info into fragment shader from js file. The following is my js code.

    

    var VSHADER_SOURCE = 
     'attribute vec4 a_Position;\n'+
     'attribute vec4 a_Color;\n'+
     'varying vec4 v_Color;\n'+
     'void main(){\n'+
      'gl_Position = a_Position;\n'+
      'v_Color = a_Color;\n'+
  '}\n';


    var FSHADER_SOURCE = 
     'precision highp float;\n'+
     'varying vec4 v_Color;\n'+
     'void main() {\n'+
      'gl_FragColor = v_Color;\n'+
     '}\n';

    function main(){
     var canvas = document.getElementById('webgl');
     var gl = getWebGLContext(canvas);
     if(!gl){
      console.log('Error!');
      return;
     }
     //Init shaders.
     if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
      console.log('Error!');
      return;
     }
     var vertices = new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.0, 0.8]);
     var color = new Float32Array([0.0, 0.0, 1.0, 1.0]);
     var buffer_object = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, buffer_object);
     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
     var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
     gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_Position);

     var color_object = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, color_object);
     gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW);
     var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
     gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_Color);

     gl.clearColor(0.0, 0.0, 0.0, 1.0);
     gl.clear(gl.COLOR_BUFFER_BIT);
     gl.drawArrays(gl.TRIANGLES, 0, 3);


     return 0;
    }

This have to create a blue triangle but the only thing I see is a canvas filled with black color. Can anyone tell me what's missing?? I created two buffer objects and used one for vertex and the other for color.

# Answer

There's a lot of issues with your example but... specific problems.

You're only supplying colors for the first vertex.

You have 3 vertices but only 1 color. You should be getting an error for that. 
**Did you check the JavaScript Console for errors?**

You have 3 options to fix that

1.  Provide a color for each vertex

        new Float32Array([
          0.0, 0.0, 1.0, 1.0,
          0.0, 0.0, 1.0, 1.0,
          0.0, 0.0, 1.0, 1.0,
        ]);

2.  Turn off the a_Color attribute and supply a constant value

        gl.disableVertexAtttibArray(a_Color);
        gl.vertexAttrib4f(a_Color, 0, 0, 1, 1);

3.  Use a uniform instead of an attribute + varying

    remove all references of `a_Color` and `v_color` and instead have your
    fragment shader be

        precision highp float;
        uniform vec4 u_Color;
        void main() {
          gl_FragColor = u_Color;
        }

    Now you'd set the color with


    At Init time

        // Lookup the location
        var u_colorLocation = gl.getUniformLocation(program, "u_Color");

    At render time

        // Set the uniform
        gl.uniform4f(u_colorLocation, 0, 0, 1, 1);

If you choose #2 you'll likely run into another issue that you'll get a warning that  attirbute 0 is not enabled because, at least on my computer, `a_Color` is assigned to attribute 0. Turning it off means it has to be emulated which is slow. The solution is to make sure `a_Position` is in attribute 0 by calling `gl.bindAttribLocation` **before** linking the program.

Other issues: 

Your `initShader` function is apparently creating a program and attaching it to the WebGLRenderContext (`gl.program`). Most WebGL projects have many shader programs so it would probably be best to just return the program. In other words, instead of

    initShader(...);
    gl.getAttribLocation(gl.program, ...)

You probably want

    var program = initShader(...);
    gl.getAttribLocation(program, ...)

You'll need to fix initShader so it returns the program that was created rather than hacking it on to the WebGLRenderingContext.

Also you're using `precision highp float`. That won't work on many phones. Unless you're sure you need `highp` it's better to use `mediump`.
