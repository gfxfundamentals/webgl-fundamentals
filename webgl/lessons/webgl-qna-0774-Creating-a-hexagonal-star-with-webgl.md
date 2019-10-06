Title: Creating a hexagonal star with webgl
Description:
TOC: qna

# Question:

I have started learning to create more complex polygons with webgl recently however I am currently unable to create a hexagonal star polygon. I have tried using gl.TRIANGLES however it is creating unusual shapes which is not at all what I want to make. 

By hexagonal star I mean a 2D hexagon with triangles comming outside each edge.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

      var InitDemo = function(){
    var canvas = document.getElementById('polygon-surface');
    var gl = canvas.getContext('webgl');

    //geometry
    var vertices = [];
    var indices = [];
    vertices.push(0,0);
    indices.push(0);

                          //start by creating the hexagon vertices
    for(var i = 0; i <= 6; i++){
      var degree_offset = i * 60.0;
      var radian_offset = degree_offset * (Math.PI / 180.0);
      var x_pos = 0.5*Math.cos(radian_offset);
      var y_pos = 0.5*Math.sin(radian_offset);

      vertices.push(x_pos);
      vertices.push(y_pos);
      indices.push(i+1);
    }


    var index = 1;
    var inner_poly_vert = indices.length -1;
                          //find the outer vertices needed for the star
    for(var i = 1;i<inner_poly_vert;i++){
      var c_x = vertices[2*i+0];
      var c_y = vertices[2*i+1];
      var n_x = vertices[2*i+2];
      var n_y = vertices[2*i+3];
      var x_mp = (c_x + n_x);
      var y_mp = (c_y + n_y);
      vertices.push(x_mp,y_mp);
      indices.push(indices.length);
    }
    var temp = [];
                          //create the star from the hexagon and outer vertices
    for(var i = 0;i<6;i++){
      temp.push(0,i+1,i+2);
      temp.push(i+1,i+8,i+2);
    }

    indices = temp;
    console.log(indices);
    console.log(vertices);

    //create VBO
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    //create shader
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    var vertSrc = 'attribute vec2 coordinates;'+
            'void main(){'+
            'gl_Position = vec4(coordinates,0.0,1.0);'+
            '}';
    gl.shaderSource(vertShader, vertSrc);
    gl.compileShader(vertShader);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertShader));
      return;
    }

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    var fragSrc = 'void main(){'+
            'gl_FragColor = vec4(0.0,0.7,0.9,1.0);'+
            '}';
    gl.shaderSource(fragShader, fragSrc);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragShader));
      return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    gl.linkProgram(program);
    gl.useProgram(program);

    //association
    var coord = gl.getAttribLocation(program, 'coordinates');
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 2*Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(coord);

    //draw
    gl.clearColor(0.9, 0.2, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length/2);// change back to /2 find out what draw arrays does


      }
      
    InitDemo();


<!-- language: lang-css -->

    body{
      background-color: black;
    } 


<!-- language: lang-html -->

    <canvas id="polygon-surface" width="200px" height="200px"></canvas>


<!-- end snippet -->

I think the problem has to do with my VBO and how I reference my vertices with the Element Array Buffer.

# Answer

You need to call `gl.drawElements` to draw with indices

    gl.drawElements(gl.TRIANGLES, temp.length, gl.UNSIGNED_SHORT, 0);

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

      var InitDemo = function(){
    var canvas = document.getElementById('polygon-surface');
    var gl = canvas.getContext('webgl');

    //geometry
    var vertices = [];
    var indices = [];
    vertices.push(0,0);
    indices.push(0);

                          //start by creating the hexagon vertices
    for(var i = 0; i <= 6; i++){
      var degree_offset = i * 60.0;
      var radian_offset = degree_offset * (Math.PI / 180.0);
      var x_pos = 0.5*Math.cos(radian_offset);
      var y_pos = 0.5*Math.sin(radian_offset);

      vertices.push(x_pos);
      vertices.push(y_pos);
      indices.push(i+1);
    }


    var index = 1;
    var inner_poly_vert = indices.length -1;
                          //find the outer vertices needed for the star
    for(var i = 1;i<inner_poly_vert;i++){
      var c_x = vertices[2*i+0];
      var c_y = vertices[2*i+1];
      var n_x = vertices[2*i+2];
      var n_y = vertices[2*i+3];
      var x_mp = (c_x + n_x);
      var y_mp = (c_y + n_y);
      vertices.push(x_mp,y_mp);
      indices.push(indices.length);
    }
    var temp = [];
                          //create the star from the hexagon and outer vertices
    for(var i = 0;i<6;i++){
      temp.push(0,i+1,i+2);
      temp.push(i+1,i+8,i+2);
    }

    indices = temp;
    console.log(indices);
    console.log(vertices);

    //create VBO
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    //create shader
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    var vertSrc = 'attribute vec2 coordinates;'+
            'void main(){'+
            'gl_Position = vec4(coordinates,0.0,1.0);'+
            '}';
    gl.shaderSource(vertShader, vertSrc);
    gl.compileShader(vertShader);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertShader));
      return;
    }

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    var fragSrc = 'void main(){'+
            'gl_FragColor = vec4(0.0,0.7,0.9,1.0);'+
            '}';
    gl.shaderSource(fragShader, fragSrc);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragShader));
      return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    gl.linkProgram(program);
    gl.useProgram(program);

    //association
    var coord = gl.getAttribLocation(program, 'coordinates');
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 2*Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(coord);

    //draw
    gl.clearColor(0.9, 0.2, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, temp.length, gl.UNSIGNED_SHORT, 0);// change back to /2 find out what draw arrays does


      }

    InitDemo();

<!-- language: lang-css -->

    body{
      background-color: black;
    } 


<!-- language: lang-html -->

    <canvas id="polygon-surface" width="200px" height="200px"></canvas>



<!-- end snippet -->


