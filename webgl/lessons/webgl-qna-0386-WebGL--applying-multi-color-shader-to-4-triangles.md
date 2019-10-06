Title: WebGL: applying multi-color shader to 4 triangles
Description:
TOC: qna

# Question:

new to WebGL here. I have drawn my several triangles to look like rectangles using WebGL. I declared the color as a variable and was wondering how do I apply the multi-color effect to more than just the last two triangles drawn? Ideally I'd want the image on the right to all have that rainbow effect.

[![figure image][1]][1]

Here is the code pertaining to vertex positions and colors

    var gl;
    var vertices_and_colors = new Float32Array(6*3*4);


       window.onload = function init()
    {
   
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    
    var vertices_and_colors = [
                               vec3(-0.5, -.55, 0.0), //left triangles, 1
                               vec3(-0.5,  0.25, 0.0),
                               vec3(-0.40, -0.55, 0.0),
                               
                               vec3(-0.40, 0.25, 0.0), //left 2
                               vec3(-0.40,  -0.55, 0.0),
                               vec3(-0.5, 0.25, 0.0),
                               vec3(-0.15, 0.25, 0.0),   //l3
                               vec3(-0.5,  0.25, 0.0),
                               vec3(-0.15, 0.15, 0.0),
                               vec3(-0.5, 0.15, 0.0),   //l4
                               vec3(-0.15,  0.15, 0.0),
                               vec3(-0.5, 0.25, 0.0),
                        
                
                               
                               vec3(0.35, -0.55, 0.0),  //right triangle 1
                               vec3(0.35,  0.15, 0.0),
                               vec3(0.25, -0.55, 0.0),
                               vec3(0.25, 0.15, 0.0),
                               vec3(0.25,  -0.55, 0.0),
                               vec3(0.35, 0.15, 0.0),
                               
                               vec3(0.10, 0.25, 0.0),    //top of 't' (rainbow)
                               vec3(0.5,  0.25, 0.0),
                               vec3(0.10, 0.15, 0.0),
                               vec3(0.5, 0.15, 0.0),
                               vec3(0.10,  0.15, 0.0),
                               vec3(0.5, 0.25, 0.0),
                               
                               vec3(1.0, 0.0, 0.0), // r
                               vec3(0.0, 1.0, 0.0), // g
                               vec3(0.0, 0.0, 1.0), // b
                               vec3(0.0, 1.0, 1.0), // c
                               vec3(1.0, 0.0, 1.0), // m
                               vec3(1.0, 1.0, 0.0), // y
                               
                            
                               ];
 
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
       gl.useProgram( program );
    
      var bufferId = gl.createBuffer();
       gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    
           gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices_and_colors),    gl.STATIC_DRAW );
    
   
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    
    gl.enableVertexAttribArray( vPosition );
    
    
    var vColor = gl.getAttribLocation( program, "vColor" );
       gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 6*3*4 ); //6
    gl.enableVertexAttribArray( vColor );
    
    render();
    };

    function render() {
        gl.clear( gl.COLOR_BUFFER_BIT );
        // draw the data as an array of points
        gl.drawArrays( gl.TRIANGLES, 0, 24 ); //30
        //gl.drawArrays( gl.TRIANGLE.STRIP, 21, 30);
    }


  [1]: http://i.stack.imgur.com/X2YSR.png

# Answer

it's not clear at all what your code is doing. You've got 18 positions but only 12 vertex colors and you're calling `gl.drawArrays` with 24? 

You need the same number of vertex colors as positions so either both 18 or both 12. Then you need to call `gl.drawArrays` with the correct number. Either 18 or 12.

Also I'd suggest you use separate buffers for vertex colors and positions. It just makes things easier but since you're combining them your offset to your colors is wrong

    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 6*3*4 ); 

You've got 18 positions with 3 values each, each 4 bytes so that's `18 * 3 * 4`. 

If you used separate buffers for positions and vertex colors then you wouldn't have to make the calculation. One less thing to get wrong.

[You also might find these articles helpful](http://webglfundamentals.org)

