Title: HTML5 canvas webgl, cant get a cube to be drawn
Description:
TOC: qna

# Question:

I'm trying to make a program that draws cubes on the screen in a html5 canvas using js and webgl. I want to make it so I can just make a new cube whenever I do `webgl.makeCupe()` kinda like how with `canvasRendering2D.fillRect` works, but for some reason that isnt working, I know webgl works because it colors the background, I don't get any errors but there isn't anything drawn on the cube (beside the background) 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
     
     function create() {
      let out = new ARRAY_TYPE(16);
      if(ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
      }
      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      return out;
    }

    function perspective(out, fovy, aspect, near, far) {
      let f = 1.0 / Math.tan(fovy / 2), nf;
      out[0] = f / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;
      if (far !== null && far !== Infinity) {
        nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = (2 * far * near) * nf;
      } else {
        out[10] = -1;
        out[14] = -2 * near;
      }
      return out;
    }

     function translate(out, a, v) {
      let x = v[0], y = v[1], z = v[2];
      let a00, a01, a02, a03;
      let a10, a11, a12, a13;
      let a20, a21, a22, a23;

      if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
      }

      return out;
    }
    //shaders

    const shaders = {
      vertex: `
        precision mediump float;
        
        attribute vec4 avertPosition;
        attribute vec4 avertColor;
        
        varying vec4 vfragColor;
        
        uniform mat4 umodelMatrix;
        uniform mat4 uprojectionMatrix;
        
        void main()
        {
          vfragColor = avertColor;
          gl_Position  =  uprojectionMatrix * umodelMatrix * avertPosition;
        }
        `,
      fragment:
        `
        precision mediump float;
        
        varying vec4 vfragColor;
        void main()
        {
          gl_FragColor = vfragColor;
        }
        `
    };

    //cube class

    class Cube {
      constructor(gl){
        
        this.gl = gl;
        
        this.buffers;
        
       
        
      }
      setUp(){

        const positionBuffer = this.gl.createBuffer();
      
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
      
      
        const positions = [
          // Front face
          -1.0, -1.0,  1.0,
           1.0, -1.0,  1.0,
           1.0,  1.0,  1.0,
          -1.0,  1.0,  1.0,
      
          // Back face
          -1.0, -1.0, -1.0,
          -1.0,  1.0, -1.0,
           1.0,  1.0, -1.0,
           1.0, -1.0, -1.0,
      
          // Top face
          -1.0,  1.0, -1.0,
          -1.0,  1.0,  1.0,
           1.0,  1.0,  1.0,
           1.0,  1.0, -1.0,
      
          // Bottom face
          -1.0, -1.0, -1.0,
           1.0, -1.0, -1.0,
           1.0, -1.0,  1.0,
          -1.0, -1.0,  1.0,
      
          // Right face
           1.0, -1.0, -1.0,
           1.0,  1.0, -1.0,
           1.0,  1.0,  1.0,
           1.0, -1.0,  1.0,
      
          // Left face
          -1.0, -1.0, -1.0,
          -1.0, -1.0,  1.0,
          -1.0,  1.0,  1.0,
          -1.0,  1.0, -1.0,
        ];
      
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        const faceColors = [
          [1.0,  1.0,  1.0,  1.0],
          [1.0,  0.0,  0.0,  1.0],
          [0.0,  1.0,  0.0,  1.0],
          [0.0,  0.0,  1.0,  1.0],
          [1.0,  1.0,  0.0,  1.0],
          [1.0,  0.0,  1.0,  1.0],
        ];
      
      
        var colors = [];
      
        for (var j = 0; j < faceColors.length; ++j) {
          const c = faceColors[j];
      
          colors = colors.concat(c, c, c, c);
        }
      
        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
      
      
        const indices = [
          0,  1,  2,      0,  2,  3,    // front
          4,  5,  6,      4,  6,  7,    // back
          8,  9,  10,     8,  10, 11,   // top
          12, 13, 14,     12, 14, 15,   // bottom
          16, 17, 18,     16, 18, 19,   // right
          20, 21, 22,     20, 22, 23,   // left
        ];
      
      
        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
          new Uint16Array(indices), this.gl.STATIC_DRAW);
          
        this.buffers = {
          position: positionBuffer,
          color: colorBuffer,
          indices: indexBuffer,
        };
        
      }
    }

    //webgl class

    class WebglProgram {
     constructor(canvas){
      
      this.gl = canvas.getContext("webgl");
      
      this.program;
      
      this.shaders = {};
      
      this.cubes = [];
      
     }
     
     async setUp(){
      
      if (!this.gl) {
       log('WebGL not supported, falling back on experimental-webgl');
       this.gl = canvas.getContext('experimental-webgl');
      }
      
      if (!this.gl) {
       log('Your browser does not support WebGL');
       return null;
      }
      
      let vertexShader  = this.gl.createShader(this.gl.VERTEX_SHADER);
      let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      
      this.gl.shaderSource(vertexShader, shaders.vertex);
      this.gl.shaderSource(fragmentShader, shaders.fragment);
      
      
      this.program = this.gl.createProgram();
      
      
      [vertexShader, fragmentShader].forEach(shader => {
      
       this.gl.compileShader(shader);
      
       if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        error(`ERROR compiling a shader!`, this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
        return;
       }
       
       this.gl.attachShader(this.program, shader);
      
      });
      
      this.gl.linkProgram(this.program);
      
      
      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
       error('ERROR linking program!', this.gl.getProgramInfoLog(this.program));
       return;
      }
      
      //Delete later since its extisnisve
      
      this.gl.validateProgram(this.program);
      if (!this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS)) {
       error('ERROR validating program!', this.gl.getProgramInfoLog(this.program));
       return;
      }
      
      
      this.shaders.attributes = {
        positionAttrib : this.gl.getAttribLocation(this.program, 'avertPosition'),
        colorAttrib   : this.gl.getAttribLocation(this.program, 'avertColor'),
      };
      
      this.shaders.uniforms = {
        modelMatrix      : this.gl.getUniformLocation(this.program, 'umodelMatrix'),
        projectionMatrix : this.gl.getUniformLocation(this.program, 'uprojectionMatrix'),
      };
      
      return "Webgl Set Up";
     }
     
     clear(color){
      
      this.gl.clearColor(color[0], color[1], color[2], color[3]);
      this.gl.clearDepth(1);
      
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

      
      return "Cleared";
     }
     
     makeCube(){

      let newCube = new Cube(this.gl);
        
        newCube.setUp();
      
      this.cubes.push(newCube);
      
      return "FillRect called";
      
     }
     
     render(){
      for (let i = 0; i < this.cubes.length; i++) {

       
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.positionBuffer);
       this.gl.vertexAttribPointer(
         this.shaders.attributes.positionAttrib,
         3,
         this.gl.FLOAT,
         this.gl.FALSE,
         0 * Float32Array.BYTES_PER_ELEMENT,
         0 * Float32Array.BYTES_PER_ELEMENT
       );
      
       this.gl.enableVertexAttribArray(this.shaders.attributes.positionAttrib);
       

       
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.colorBuffer);
       this.gl.vertexAttribPointer(
         this.shaders.attributes.colorAttrib,
         4,
         this.gl.FLOAT,
         this.gl.FALSE,
         0 * Float32Array.BYTES_PER_ELEMENT,
         0 * Float32Array.BYTES_PER_ELEMENT
       );
      
       this.gl.enableVertexAttribArray(this.shaders.attributes.colorAttrib);
       
       
       this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubes[i].buffers.indices);
        
       this.gl.useProgram(this.program);
       
          const projectionMatrix = create();
          const modelMatrix  = create();
          
          
          const fieldOfView = 45 * Math.PI / 180;
          const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
          const zNear = 0.1;
          const zFar = 100.0;

      
          perspective(projectionMatrix,
                       fieldOfView,
                       aspect,
                       zNear,
                       zFar);
                       
          translate(modelMatrix,
            modelMatrix,
            [0.0, 0.0, -6.0]
            );
          

          this.gl.uniformMatrix4fv(
              this.shaders.uniforms.projectionMatrix,
              false,
              projectionMatrix);
              
          this.gl.uniformMatrix4fv(
              this.shaders.uniforms.modelMatrix,
              false,
              modelMatrix);
              
          this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
          
              
      }
     }
    }




<!-- language: lang-html -->

    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <title>repl.it</title>
        <link href="style.css" rel="stylesheet" type="text/css" />
      </head>
      <body>
        <canvas id = "webglCanvas"></canvas>
        <script>
          onload = function(){

            let canvas = document.querySelector("#webglCanvas")

            let webgl = new WebglProgram(canvas)

            canvas.width = 500;
            canvas.height = 500;

            webgl.setUp()

            .then(()=>{
              webgl.gl.viewport(0, 0, 500, 500);
              webgl.makeCube()
              loop(webgl)
            })
          }

          function loop(webgl){
            function draw(){
              webgl.clear([1, 1, 0, 1])
              
              webgl.render()

              requestAnimationFrame(draw)

            }
            requestAnimationFrame(draw)
          }

        </script>
      </body>
    </html>

<!-- end snippet -->



# Answer

The first thing you should do is check [the JavaScript console](https://developers.google.com/web/tools/chrome-devtools/console/)

The code you posted shows an error and you should try to fix that error

[![enter image description here][1]][1]

Seeing the error above is about no buffers being bound I looked at the code for the place it's binding buffers. I put a breakpoint there [in the debugger](https://developers.google.com/web/tools/chrome-devtools/javascript/)

Inspecting the values I see you were using `positionBuffer` and `colorBuffer` but they are called just `position` and `color`

[![enter image description here][2]][2]

Fixing those something gets drawn.


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

    function create() {
      let out = new ARRAY_TYPE(16);
      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
      }
      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      return out;
    }

    function perspective(out, fovy, aspect, near, far) {
      let f = 1.0 / Math.tan(fovy / 2),
        nf;
      out[0] = f / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;
      if (far !== null && far !== Infinity) {
        nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = (2 * far * near) * nf;
      } else {
        out[10] = -1;
        out[14] = -2 * near;
      }
      return out;
    }

    function translate(out, a, v) {
      let x = v[0],
        y = v[1],
        z = v[2];
      let a00, a01, a02, a03;
      let a10, a11, a12, a13;
      let a20, a21, a22, a23;

      if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      } else {
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a10 = a[4];
        a11 = a[5];
        a12 = a[6];
        a13 = a[7];
        a20 = a[8];
        a21 = a[9];
        a22 = a[10];
        a23 = a[11];

        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a03;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a20;
        out[9] = a21;
        out[10] = a22;
        out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
      }

      return out;
    }
    //shaders

    const shaders = {
      vertex: `
        precision mediump float;
        
        attribute vec4 avertPosition;
        attribute vec4 avertColor;
        
        varying vec4 vfragColor;
        
        uniform mat4 umodelMatrix;
        uniform mat4 uprojectionMatrix;
        
        void main()
        {
          vfragColor = avertColor;
          gl_Position  =  uprojectionMatrix * umodelMatrix * avertPosition;
        }
        `,
      fragment: `
        precision mediump float;
        
        varying vec4 vfragColor;
        void main()
        {
          gl_FragColor = vfragColor;
        }
        `
    };

    //cube class

    class Cube {
      constructor(gl) {

        this.gl = gl;

        this.buffers;



      }
      setUp() {

        const positionBuffer = this.gl.createBuffer();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);


        const positions = [
          // Front face
          -1.0, -1.0, 1.0,
          1.0, -1.0, 1.0,
          1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

          // Back face
          -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
          1.0, 1.0, -1.0,
          1.0, -1.0, -1.0,

          // Top face
          -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
          1.0, 1.0, 1.0,
          1.0, 1.0, -1.0,

          // Bottom face
          -1.0, -1.0, -1.0,
          1.0, -1.0, -1.0,
          1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

          // Right face
          1.0, -1.0, -1.0,
          1.0, 1.0, -1.0,
          1.0, 1.0, 1.0,
          1.0, -1.0, 1.0,

          // Left face
          -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        const faceColors = [
          [1.0, 1.0, 1.0, 1.0],
          [1.0, 0.0, 0.0, 1.0],
          [0.0, 1.0, 0.0, 1.0],
          [0.0, 0.0, 1.0, 1.0],
          [1.0, 1.0, 0.0, 1.0],
          [1.0, 0.0, 1.0, 1.0],
        ];


        var colors = [];

        for (var j = 0; j < faceColors.length; ++j) {
          const c = faceColors[j];

          colors = colors.concat(c, c, c, c);
        }

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);


        const indices = [
          0, 1, 2, 0, 2, 3, // front
          4, 5, 6, 4, 6, 7, // back
          8, 9, 10, 8, 10, 11, // top
          12, 13, 14, 12, 14, 15, // bottom
          16, 17, 18, 16, 18, 19, // right
          20, 21, 22, 20, 22, 23, // left
        ];


        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
          new Uint16Array(indices), this.gl.STATIC_DRAW);

        this.buffers = {
          position: positionBuffer,
          color: colorBuffer,
          indices: indexBuffer,
        };

      }
    }

    //webgl class

    class WebglProgram {
      constructor(canvas) {

        this.gl = canvas.getContext("webgl");

        this.program;

        this.shaders = {};

        this.cubes = [];

      }

      async setUp() {

        if (!this.gl) {
          log('WebGL not supported, falling back on experimental-webgl');
          this.gl = canvas.getContext('experimental-webgl');
        }

        if (!this.gl) {
          log('Your browser does not support WebGL');
          return null;
        }

        let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(vertexShader, shaders.vertex);
        this.gl.shaderSource(fragmentShader, shaders.fragment);


        this.program = this.gl.createProgram();


        [vertexShader, fragmentShader].forEach(shader => {

          this.gl.compileShader(shader);

          if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            error(`ERROR compiling a shader!`, this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return;
          }

          this.gl.attachShader(this.program, shader);

        });

        this.gl.linkProgram(this.program);


        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
          error('ERROR linking program!', this.gl.getProgramInfoLog(this.program));
          return;
        }

        //Delete later since its extisnisve

        this.gl.validateProgram(this.program);
        if (!this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS)) {
          error('ERROR validating program!', this.gl.getProgramInfoLog(this.program));
          return;
        }


        this.shaders.attributes = {
          positionAttrib: this.gl.getAttribLocation(this.program, 'avertPosition'),
          colorAttrib: this.gl.getAttribLocation(this.program, 'avertColor'),
        };

        this.shaders.uniforms = {
          modelMatrix: this.gl.getUniformLocation(this.program, 'umodelMatrix'),
          projectionMatrix: this.gl.getUniformLocation(this.program, 'uprojectionMatrix'),
        };

        return "Webgl Set Up";
      }

      clear(color) {

        this.gl.clearColor(color[0], color[1], color[2], color[3]);
        this.gl.clearDepth(1);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


        return "Cleared";
      }

      makeCube() {

        let newCube = new Cube(this.gl);

        newCube.setUp();

        this.cubes.push(newCube);

        return "FillRect called";

      }

      render() {
        for (let i = 0; i < this.cubes.length; i++) {


          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.position);
          this.gl.vertexAttribPointer(
            this.shaders.attributes.positionAttrib,
            3,
            this.gl.FLOAT,
            this.gl.FALSE,
            0 * Float32Array.BYTES_PER_ELEMENT,
            0 * Float32Array.BYTES_PER_ELEMENT
          );

          this.gl.enableVertexAttribArray(this.shaders.attributes.positionAttrib);



          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.color);
          this.gl.vertexAttribPointer(
            this.shaders.attributes.colorAttrib,
            4,
            this.gl.FLOAT,
            this.gl.FALSE,
            0 * Float32Array.BYTES_PER_ELEMENT,
            0 * Float32Array.BYTES_PER_ELEMENT
          );

          this.gl.enableVertexAttribArray(this.shaders.attributes.colorAttrib);


          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubes[i].buffers.indices);

          this.gl.useProgram(this.program);

          const projectionMatrix = create();
          const modelMatrix = create();


          const fieldOfView = 45 * Math.PI / 180;
          const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
          const zNear = 0.1;
          const zFar = 100.0;


          perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);

          translate(modelMatrix,
            modelMatrix, [0.0, 0.0, -6.0]
          );


          this.gl.uniformMatrix4fv(
            this.shaders.uniforms.projectionMatrix,
            false,
            projectionMatrix);

          this.gl.uniformMatrix4fv(
            this.shaders.uniforms.modelMatrix,
            false,
            modelMatrix);

          this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);


        }
      }
    }

    function main() {

      let canvas = document.querySelector("#webglCanvas")

      let webgl = new WebglProgram(canvas)

      canvas.width = 500;
      canvas.height = 500;

      webgl.setUp()

        .then(() => {
          webgl.gl.viewport(0, 0, 500, 500);
          webgl.makeCube()
          loop(webgl)
        })
    }

    function loop(webgl) {
      function draw() {
        webgl.clear([1, 1, 0, 1])

        webgl.render()

        requestAnimationFrame(draw)

      }
      requestAnimationFrame(draw)
    }

    main();

<!-- language: lang-html -->

    <canvas id="webglCanvas"></canvas>

<!-- end snippet -->

Note you might be able to catch these types of errors by using a [webgl debug context](https://www.khronos.org/webgl/wiki/Debugging). It's a library that wraps WebGL and checks for errors. The link above also shows how to check for passing `undefined` which is what happens when there is a typo like the one above.

Also just in case check out [these tutorials](https://webglfundamentals.org)


  [1]: https://i.stack.imgur.com/rVpVY.png
  [2]: https://i.stack.imgur.com/5MtJB.png
