Title: How do i use stride in webgl?
Description:
TOC: qna

# Question:

    //Defining geometry
 var vertices = [
  +0.0,+0.0,+0.0,
  +0.0,+0.0,+1.0,
  
  -0.5,+0.0,+0.0,
  +1.0,+0.0,+0.0, 

  -0.5,-0.5,+0.0,
  +0.0,+1.0,+0.0,
  
  +0.5,+0.5,+0.0,
  +1.0,+0.0,+1.0, 
  
  +0.5,+0.0,+0.0,
  +1.0,+1.0,+0.0, 
  
  -0.5,+0.5,+0.0
  +1.0,+0.0,+1.0
 ];


 
 indices = [3,4,0,0,2,1,5,0,1];

 var VextexBuffer = webgl.createBuffer();

 webgl.bindBuffer(webgl.ARRAY_BUFFER, VextexBuffer);

 webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(vertices), webgl.STATIC_DRAW);

 var coord = webgl.getAttribLocation(shaderProgram,"coordinates");

 webgl.vertexAttribPointer(coord, 3, webgl.FLOAT, false ,6 * 4,0);

 webgl.enableVertexAttribArray(coord);
 
 var color = webgl.getAttribLocation(shaderProgram, "color");

 webgl.vertexAttribPointer(color, 3, webgl.FLOAT, false ,6 * 4,3 * 4);

 webgl.enableVertexAttribArray(color);  
 
 
 var IndexBuffer = webgl.createBuffer();

 webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, IndexBuffer);

 webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), webgl.STATIC_DRAW);


I want to use stride in VertexAttribPointer method to use a single VBO for both vertex and color data rather than using 2 VBOs but the problem is i don't know the size of a float in javascript. So i assumed it to be 4.

Now i am getting this error:- 

    **[.CommandBufferContext]GL ERROR :GL_INVALID_OPERATION : glDrawElements:        
    attempt to access out of range vertices in attribute 1**

i think the problem is in :-

 webgl.vertexAttribPointer(coord, 3, webgl.FLOAT, false ,6 * 4,0);

and :-

 webgl.vertexAttribPointer(color, 3, webgl.FLOAT, false ,6 * 4,3 * 4);

Please tell where the fault is ?
THANKS.


# Answer

The size of a FLOAT is 4 in WebGL. It has nothing to do with numbers or floats JavaScript. Floats/numbers in JavaScript are separate from Floats in WebGL buffers.

Where is your draw call? It's not clear from the code above what's wrong. It looks correct at a glance

Testing it below I found 1, issue. You were missing a comma between the last coordinate and the last color which means your `vertices` array was one value short

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var webgl = document.querySelector("#c").getContext("webgl");
    var shaderProgram = twgl.createProgramFromScripts(webgl, ["vs", "fs"]);
    webgl.useProgram(shaderProgram);

    //Defining geometry
    var vertices = [
        +0.0,+0.0,+0.0,
        +0.0,+0.0,+1.0,

        -0.5,+0.0,+0.0,
        +1.0,+0.0,+0.0, 

        -0.5,-0.5,+0.0,
        +0.0,+1.0,+0.0,

        +0.5,+0.5,+0.0,
        +1.0,+0.0,+1.0, 

        +0.5,+0.0,+0.0,
        +1.0,+1.0,+0.0, 

        -0.5,+0.5,+0.0,
        +1.0,+0.0,+1.0
    ];


    indices = [3,4,0,0,2,1,5,0,1];

    var VextexBuffer = webgl.createBuffer();

    webgl.bindBuffer(webgl.ARRAY_BUFFER, VextexBuffer);

    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(vertices), webgl.STATIC_DRAW);

    var coord = webgl.getAttribLocation(shaderProgram,"coordinates");

    webgl.vertexAttribPointer(coord, 3, webgl.FLOAT, false ,6 * 4,0);

    webgl.enableVertexAttribArray(coord);

    var color = webgl.getAttribLocation(shaderProgram, "color");

    webgl.vertexAttribPointer(color, 3, webgl.FLOAT, false ,6 * 4,3 * 4);

    webgl.enableVertexAttribArray(color);       


    var IndexBuffer = webgl.createBuffer();

    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, IndexBuffer);

    webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), webgl.STATIC_DRAW);

    webgl.drawElements(webgl.TRIANGLES, 6, webgl.UNSIGNED_SHORT, 0);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <script id="vs" type="notjs">
    attribute vec4 coordinates;
    attribute vec4 color;

    varying vec4 v_color;

    void main() {
      gl_Position = coordinates;
      v_color = color;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
    </script>
    <canvas id="c"></canvas>

<!-- end snippet -->


