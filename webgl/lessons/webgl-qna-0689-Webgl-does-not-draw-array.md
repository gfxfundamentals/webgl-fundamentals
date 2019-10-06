Title: Webgl does not draw array
Description:
TOC: qna

# Question:

I am trying to draw square grid on canvas.The array is filled with vertices. But the page remains blank. There seems to be no error. Thank you

        var canvas;
        var gl;
        var grid = [];
        
        var maxNumTriangles = 200;
        var maxNumVertices = 3 * maxNumTriangles;
        var index = 0;
        
        window.onload = function init() {
            canvas = document.getElementById("gl-canvas");
            gl = WebGLUtils.setupWebGL(canvas);
            if (!gl) { alert("WebGL isn't available"); }
            canvas.addEventListener("mousedown", function (event) {
                gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                gridarray();
                document.write(grid[0]);
                gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(grid));
               
            });
        
        
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
        
            var program = initShaders(gl, "vertex-shader", "fragment-shader");
            gl.useProgram(program);
        
        
            var vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW);
        
            var vPosition = gl.getAttribLocation(program, "vPosition");
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
        
            var cBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            //gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);
        
            render();
        
        }
        
        function gridarray() {
            p = 10;
            
            for (var x = 0; x <= 500; x += 40) {
                var g = new Float32Array([0.5 + x + p, p]);
                var g1 = new Float32Array([0.5 + x + p, 500 + p]);
                grid.push(g);
                grid.push(g1);
            }
        
        
            for (var x = 0; x <= 500; x += 40) {
                var g = new Float32Array([p, 0.5 + x + p]);
                var g1 = new Float32Array([500 + p, 0.5 + x + p]);
                grid.push(g);
                grid.push(g1);
            }
        }
        function render() {
        
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.LINES, 0, 20);
            window.requestAnimFrame(render);
        
        }
    Fragment and Vertex shader
    
attribute vec4 vPosition;
        void
        main()
        {
        gl_Position = vPosition;
        }
    </script>
 
    
    void main()
        {
        gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
        }



# Answer

you should post executable code. Without seeing the rest of the code it's hard to tell what's wrong. 

Of the top of my head

*   What does flatten return?

    I know of no `flatten` that takes an array of `Float32Array`s and 
    and returns a `Float32Array` but I guess your's does?

*   It looks like you're passing in pixel coordinates but 
    [WebGL requires clip space coordinates](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html).
    

