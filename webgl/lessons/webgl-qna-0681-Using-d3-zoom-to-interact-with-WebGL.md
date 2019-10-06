Title: Using d3-zoom to interact with WebGL
Description:
TOC: qna

# Question:

I'm trying to get a small example together that uses d3-zoom to provide simple interactivity to a canvas element that renders using WebGL. All I'd like to do is provide panning/zooming, which is fairly straightforward using a 4x4 transformation matrix.

The issue I'm having is with zooming (scaling). If you take a look at some of the d3-zoom examples, you'll see that the zooming focal point is always at the location of the mouse.

If you use the `k`, `tx`, and `ty`, values from the zoom transform directly, the panning works, but zooming is offset by half the width and height of the canvas, see

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var width = 300,
            height = 150;

        var zoom = d3.zoom()
            .on( 'zoom', zoomed );

        var canvas = d3.select( 'body' )
            .append( 'canvas' )
            .attr( 'width', width )
            .attr( 'height', height )
            .call( zoom );

        var gl = canvas.node().getContext( 'webgl' );
        var shader = basic_shader(gl);

        initialize_gl();
        set_transform( 1, 0, 0 );

        function zoomed () {
            var t = d3.event.transform;
            set_transform( t.k, t.x, t.y );
        }

        function initialize_gl () {

            var sb = d3.color('steelblue');
            gl.clearColor(sb.r / 255, sb.g / 255, sb.b / 255, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var vertices = [
                0.5, 0.5, 0.0, 1.0,
                -0.5, 0.5, 0.0, 1.0,
                0.5, -0.5, 0.0, 1.0,
                -0.5, -0.5, 0.0, 1.0
            ];

            var colors = [
                1.0, 1.0, 1.0, 1.0,    // white
                1.0, 0.0, 0.0, 1.0,    // red
                0.0, 1.0, 0.0, 1.0,    // green
                0.0, 0.0, 1.0, 1.0     // blue
            ];

            var vertex_buffer = gl.createBuffer();
            var color_buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.color_attrib, 4, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.vertex_attrib, 4, gl.FLOAT, false, 0, 0);

        }

        function set_transform ( k, tx, ty ) {

            var matrix = new Float32Array([
                k, 0, 0, 0,
                0, k, 0, 0,
                0, 0, 1, 0,
                2*tx/width, -2*ty/height, 0, 1
            ]);

            gl.uniformMatrix4fv( shader.matrix_uniform, false, matrix );
            gl.clear( gl.COLOR_BUFFER_BIT );
            gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

        }

        function basic_vertex () {

            return [
                'attribute vec4 vertex_position;',
                'attribute vec4 vertex_color;',
                'varying lowp vec4 vert_color;',
                'uniform mat4 matrix;',
                'void main( void ) {',
                '   gl_Position = matrix * vertex_position;',
                '   vert_color = vertex_color;',
                '}'
            ].join('\n');

        }

        function basic_fragment () {

            return [
                'varying lowp vec4 vert_color;',
                'void main( void ) {',
                '   gl_FragColor = vert_color;',
                '}'
            ].join('\n');

        }

        function basic_shader ( gl ) {

            var program = gl_program( gl, basic_vertex(), basic_fragment() );

            gl.useProgram( program );
            program.vertex_attrib = gl.getAttribLocation( program, 'vertex_position' );
            program.color_attrib = gl.getAttribLocation( program, 'vertex_color' );
            program.matrix_uniform = gl.getUniformLocation( program, 'matrix' );
            program.translate_uniform = gl.getUniformLocation( program, 'translate_matrix' );
            program.scale_uniform = gl.getUniformLocation( program, 'scale_matrix' );
            gl.enableVertexAttribArray( program.vertex_attrib );
            gl.enableVertexAttribArray( program.color_attrib );

            return program;

        }

        function gl_shader ( gl, type, code ) {

            var shader = gl.createShader( type );
            gl.shaderSource( shader, code );
            gl.compileShader( shader );
            return shader;

        }

        function gl_program ( gl, vertex_source, fragment_source ) {

            var shader_program = gl.createProgram();
            var vertex_shader = gl_shader( gl, gl.VERTEX_SHADER, vertex_source );
            var fragment_shader = gl_shader( gl, gl.FRAGMENT_SHADER, fragment_source );

            if ( shader_program && vertex_shader && fragment_shader ) {

                gl.attachShader( shader_program, vertex_shader );
                gl.attachShader( shader_program, fragment_shader );
                gl.linkProgram( shader_program );

                gl.deleteShader( vertex_shader );
                gl.deleteShader( fragment_shader );

                return shader_program;

            }

        }

<!-- language: lang-html -->

    <script src="https://d3js.org/d3.v4.min.js"></script>

<!-- end snippet -->

My hunch is that this has to do with the fact that in WebGL, the viewport x- and y-coordinates each go from -1 to 1, whereas d3-zoom uses the mouse coordinates within the canvas element, which when normalized can be in the range 0 to 1.

You can see that this is the case if you place the mouse in the very top left corner of the canvas ((0,0) in canvas coordinates) and try zooming. It will zoom as if the mouse is at the center of the canvas ((0,0) in WebGL coordinates).

In order to fix this, you can subtract 1 (i.e. half the width of a coordinate system [-1,1] ) from the x translation and add 1 (i.e. half the height of a coordinate system [-1,1]) to the y translation, as shown here

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->


        var width = 300,
            height = 150;

        var zoom = d3.zoom()
            .on( 'zoom', zoomed );

        var canvas = d3.select( 'body' )
            .append( 'canvas' )
            .attr( 'width', width )
            .attr( 'height', height )
            .call( zoom );

        var gl = canvas.node().getContext( 'webgl' );
        var shader = basic_shader(gl);

        initialize_gl();
        set_transform( 1, 0, 0 );

        function zoomed () {
            var t = d3.event.transform;
            set_transform( t.k, t.x, t.y );
        }

        function initialize_gl () {

            var sb = d3.color('steelblue');
            gl.clearColor(sb.r / 255, sb.g / 255, sb.b / 255, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var vertices = [
                0.5, 0.5, 0.0, 1.0,
                -0.5, 0.5, 0.0, 1.0,
                0.5, -0.5, 0.0, 1.0,
                -0.5, -0.5, 0.0, 1.0
            ];

            var colors = [
                1.0, 1.0, 1.0, 1.0,    // white
                1.0, 0.0, 0.0, 1.0,    // red
                0.0, 1.0, 0.0, 1.0,    // green
                0.0, 0.0, 1.0, 1.0     // blue
            ];

            var vertex_buffer = gl.createBuffer();
            var color_buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.color_attrib, 4, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.vertex_attrib, 4, gl.FLOAT, false, 0, 0);

        }

        function set_transform ( k, tx, ty ) {

            var matrix = new Float32Array([
                k, 0, 0, 0,
                0, k, 0, 0,
                0, 0, 1, 0,
                2*tx/width-1.0, -2*ty/height+1.0, 0, 1
            ]);

            gl.uniformMatrix4fv( shader.matrix_uniform, false, matrix );
            gl.clear( gl.COLOR_BUFFER_BIT );
            gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

        }

        function basic_vertex () {

            return [
                'attribute vec4 vertex_position;',
                'attribute vec4 vertex_color;',
                'varying lowp vec4 vert_color;',
                'uniform mat4 matrix;',
                'void main( void ) {',
                '   gl_Position = matrix * vertex_position;',
                '   vert_color = vertex_color;',
                '}'
            ].join('\n');

        }

        function basic_fragment () {

            return [
                'varying lowp vec4 vert_color;',
                'void main( void ) {',
                '   gl_FragColor = vert_color;',
                '}'
            ].join('\n');

        }

        function basic_shader ( gl ) {

            var program = gl_program( gl, basic_vertex(), basic_fragment() );

            gl.useProgram( program );
            program.vertex_attrib = gl.getAttribLocation( program, 'vertex_position' );
            program.color_attrib = gl.getAttribLocation( program, 'vertex_color' );
            program.matrix_uniform = gl.getUniformLocation( program, 'matrix' );
            program.translate_uniform = gl.getUniformLocation( program, 'translate_matrix' );
            program.scale_uniform = gl.getUniformLocation( program, 'scale_matrix' );
            gl.enableVertexAttribArray( program.vertex_attrib );
            gl.enableVertexAttribArray( program.color_attrib );

            return program;

        }

        function gl_shader ( gl, type, code ) {

            var shader = gl.createShader( type );
            gl.shaderSource( shader, code );
            gl.compileShader( shader );
            return shader;

        }

        function gl_program ( gl, vertex_source, fragment_source ) {

            var shader_program = gl.createProgram();
            var vertex_shader = gl_shader( gl, gl.VERTEX_SHADER, vertex_source );
            var fragment_shader = gl_shader( gl, gl.FRAGMENT_SHADER, fragment_source );

            if ( shader_program && vertex_shader && fragment_shader ) {

                gl.attachShader( shader_program, vertex_shader );
                gl.attachShader( shader_program, fragment_shader );
                gl.linkProgram( shader_program );

                gl.deleteShader( vertex_shader );
                gl.deleteShader( fragment_shader );

                return shader_program;

            }

        }


<!-- language: lang-html -->

    <script src="https://d3js.org/d3.v4.min.js"></script>


<!-- end snippet -->

However, by performing the offset, your scene is initially translated, which isn't exactly ideal. So my question is, what is the best way to handle this? Is it best handled by the d3 side or the WebGL side?


  [1]: https://bl.ocks.org/atdyer/6d37495bea001ebdab631a00b2b426c5
  [2]: https://bl.ocks.org/atdyer/74b315c6e736762e79d2370ca10418e2

# Answer

I just moved your vertices over to match your matrix

        var vertices = [
             .5,  -.5, 0.0, 1.0,
            1.5,  -.5, 0.0, 1.0,
             .5, -1.5, 0.0, 1.0,
            1.5, -1.5, 0.0, 1.0
        ];      

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var width = 300,
            height = 150;

        var zoom = d3.zoom()
            .on( 'zoom', zoomed );

        var canvas = d3.select( 'body' )
            .append( 'canvas' )
            .attr( 'width', width )
            .attr( 'height', height )
            .call( zoom );

        var gl = canvas.node().getContext( 'webgl' );
        var shader = basic_shader(gl);

        initialize_gl();
        set_transform( 1, 0, 0 );

        function zoomed () {
            var t = d3.event.transform;
            set_transform( t.k, t.x, t.y );
        }

        function initialize_gl () {

            var sb = d3.color('steelblue');
            gl.clearColor(sb.r / 255, sb.g / 255, sb.b / 255, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var vertices = [
                 .5,  -.5, 0.0, 1.0,
                1.5,  -.5, 0.0, 1.0,
                 .5, -1.5, 0.0, 1.0,
                1.5, -1.5, 0.0, 1.0
            ];        

            var colors = [
                1.0, 1.0, 1.0, 1.0,    // white
                1.0, 0.0, 0.0, 1.0,    // red
                0.0, 1.0, 0.0, 1.0,    // green
                0.0, 0.0, 1.0, 1.0     // blue
            ];

            var vertex_buffer = gl.createBuffer();
            var color_buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.color_attrib, 4, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.vertex_attrib, 4, gl.FLOAT, false, 0, 0);

        }

        function set_transform ( k, tx, ty ) {

            var matrix = new Float32Array([
                k, 0, 0, 0,
                0, k, 0, 0,
                0, 0, 1, 0,
                2*tx/width-1.0, -2*ty/height+1.0, 0, 1
            ]);

            gl.uniformMatrix4fv( shader.matrix_uniform, false, matrix );
            gl.clear( gl.COLOR_BUFFER_BIT );
            gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

        }

        function basic_vertex () {

            return [
                'attribute vec4 vertex_position;',
                'attribute vec4 vertex_color;',
                'varying lowp vec4 vert_color;',
                'uniform mat4 matrix;',
                'void main( void ) {',
                '   gl_Position = matrix * vertex_position;',
                '   vert_color = vertex_color;',
                '}'
            ].join('\n');

        }

        function basic_fragment () {

            return [
                'varying lowp vec4 vert_color;',
                'void main( void ) {',
                '   gl_FragColor = vert_color;',
                '}'
            ].join('\n');

        }

        function basic_shader ( gl ) {

            var program = gl_program( gl, basic_vertex(), basic_fragment() );

            gl.useProgram( program );
            program.vertex_attrib = gl.getAttribLocation( program, 'vertex_position' );
            program.color_attrib = gl.getAttribLocation( program, 'vertex_color' );
            program.matrix_uniform = gl.getUniformLocation( program, 'matrix' );
            program.translate_uniform = gl.getUniformLocation( program, 'translate_matrix' );
            program.scale_uniform = gl.getUniformLocation( program, 'scale_matrix' );
            gl.enableVertexAttribArray( program.vertex_attrib );
            gl.enableVertexAttribArray( program.color_attrib );

            return program;

        }

        function gl_shader ( gl, type, code ) {

            var shader = gl.createShader( type );
            gl.shaderSource( shader, code );
            gl.compileShader( shader );
            return shader;

        }

        function gl_program ( gl, vertex_source, fragment_source ) {

            var shader_program = gl.createProgram();
            var vertex_shader = gl_shader( gl, gl.VERTEX_SHADER, vertex_source );
            var fragment_shader = gl_shader( gl, gl.FRAGMENT_SHADER, fragment_source );

            if ( shader_program && vertex_shader && fragment_shader ) {

                gl.attachShader( shader_program, vertex_shader );
                gl.attachShader( shader_program, fragment_shader );
                gl.linkProgram( shader_program );

                gl.deleteShader( vertex_shader );
                gl.deleteShader( fragment_shader );

                return shader_program;

            }

        }

<!-- language: lang-html -->

    <script src="https://d3js.org/d3.v4.min.js"></script>

<!-- end snippet -->

But honestly I'd probably use a math library and use a few transforms. It's easier for me to understand the code that way.  I'm not sure what the "space" of D3. I guess though it's just passing you an offset and a scale. In which case

            // change the space to be pixels with 0,0 in top left
            var matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

            // apply the d3 translate and zoom
            matrix = m4.translate(matrix, [tx, ty, 0]);
            matrix = m4.scale(matrix, [k, k, 1]);

            // translate the unit quad to the center 
            matrix = m4.translate(matrix, [width / 2, height / 2, 0]);

            // make the unit quad be half the size of the canvas
            matrix = m4.scale(matrix, [width / 2, height / 2 , 1]);

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var m4 = twgl.m4;
        var width = 300,
            height = 150;

        var zoom = d3.zoom()
            .on( 'zoom', zoomed );

        var canvas = d3.select( 'body' )
            .append( 'canvas' )
            .attr( 'width', width )
            .attr( 'height', height )
            .call( zoom );

        var gl = canvas.node().getContext( 'webgl' );
        var shader = basic_shader(gl);

        initialize_gl();
        set_transform( 1, 0, 0 );

        function zoomed () {
            var t = d3.event.transform;
            set_transform( t.k, t.x, t.y );
        }

        function initialize_gl () {

            var sb = d3.color('steelblue');
            gl.clearColor(sb.r / 255, sb.g / 255, sb.b / 255, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var vertices = [
                -.5,   .5, 0.0, 1.0,
                 .5,   .5, 0.0, 1.0,
                -.5,  -.5, 0.0, 1.0,
                 .5,  -.5, 0.0, 1.0
            ];        

            var colors = [
                1.0, 1.0, 1.0, 1.0,    // white
                1.0, 0.0, 0.0, 1.0,    // red
                0.0, 1.0, 0.0, 1.0,    // green
                0.0, 0.0, 1.0, 1.0     // blue
            ];

            var vertex_buffer = gl.createBuffer();
            var color_buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.color_attrib, 4, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.vertex_attrib, 4, gl.FLOAT, false, 0, 0);

        }

        function set_transform ( k, tx, ty ) {

            // change the space to be pixels with 0,0 in top left
            var matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
            // apply the d3 translate and zoom
            matrix = m4.translate(matrix, [tx, ty, 0]);
            matrix = m4.scale(matrix, [k, k, 1]);
            // translate the unit quad to the center 
            matrix = m4.translate(matrix, [width / 2, height / 2, 0]);
            // make the unit quad be half the size of the canvas
            matrix = m4.scale(matrix, [width / 2, height / 2 , 1]);

            gl.uniformMatrix4fv( shader.matrix_uniform, false, matrix );
            gl.clear( gl.COLOR_BUFFER_BIT );
            gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

        }

        function basic_vertex () {

            return [
                'attribute vec4 vertex_position;',
                'attribute vec4 vertex_color;',
                'varying lowp vec4 vert_color;',
                'uniform mat4 matrix;',
                'void main( void ) {',
                '   gl_Position = matrix * vertex_position;',
                '   vert_color = vertex_color;',
                '}'
            ].join('\n');

        }

        function basic_fragment () {

            return [
                'varying lowp vec4 vert_color;',
                'void main( void ) {',
                '   gl_FragColor = vert_color;',
                '}'
            ].join('\n');

        }

        function basic_shader ( gl ) {

            var program = gl_program( gl, basic_vertex(), basic_fragment() );

            gl.useProgram( program );
            program.vertex_attrib = gl.getAttribLocation( program, 'vertex_position' );
            program.color_attrib = gl.getAttribLocation( program, 'vertex_color' );
            program.matrix_uniform = gl.getUniformLocation( program, 'matrix' );
            program.translate_uniform = gl.getUniformLocation( program, 'translate_matrix' );
            program.scale_uniform = gl.getUniformLocation( program, 'scale_matrix' );
            gl.enableVertexAttribArray( program.vertex_attrib );
            gl.enableVertexAttribArray( program.color_attrib );

            return program;

        }

        function gl_shader ( gl, type, code ) {

            var shader = gl.createShader( type );
            gl.shaderSource( shader, code );
            gl.compileShader( shader );
            return shader;

        }

        function gl_program ( gl, vertex_source, fragment_source ) {

            var shader_program = gl.createProgram();
            var vertex_shader = gl_shader( gl, gl.VERTEX_SHADER, vertex_source );
            var fragment_shader = gl_shader( gl, gl.FRAGMENT_SHADER, fragment_source );

            if ( shader_program && vertex_shader && fragment_shader ) {

                gl.attachShader( shader_program, vertex_shader );
                gl.attachShader( shader_program, fragment_shader );
                gl.linkProgram( shader_program );

                gl.deleteShader( vertex_shader );
                gl.deleteShader( fragment_shader );

                return shader_program;

            }

        }

<!-- language: lang-html -->

    <script src="https://d3js.org/d3.v4.min.js"></script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->


