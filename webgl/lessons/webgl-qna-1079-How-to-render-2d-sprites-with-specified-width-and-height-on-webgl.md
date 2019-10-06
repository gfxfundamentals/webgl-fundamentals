Title: How to render 2d sprites with specified width and height on webgl
Description:
TOC: qna

# Question:

I want to render 2d sprites with some width/height. I try this:

vertices setup:
      
      // width/height in canvas dimensions space
      const width = 100,
            height = 100;

      const left = 0,
            right = width,
            down = 0,
            up = height;
      /*
        (-1, 1).( 1, 1)
        .
        (-1,-1).( 1,-1)
      */
      let positions = [
        left, down,
        left, up,
        right, down,
        left, up,
        right, down,
        right, up
      ];
    
    
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

vertex shader:

    in vec2 a_position;
    
    out vec2 vQuadCoord;
    
    uniform vec2 uResolution;
    
    uniform mat3 uMatrix;
    
    void main() {
    
      vec2 position = (uMatrix * vec3(a_position, 1)).xy;
    
      vec2 zeroToOne = position / uResolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
    
      // no translation for quad coordinates
      vQuadCoord = (a_position / uResolution) * 2.0 - 1.0;
    
      gl_Position = vec4(clipSpace, 0, 1);
    
    }

`uResolution` uniform is `[gl.canvas.width, gl.canvas.height]`. 
The problem is when I set the width to smaller size, the shapes inside the sprite doesn't scale.
Is this correct way to render sprites with specified width/height?

# Answer

not 100% sure I understand your question but...

From your [previous question](https://stackoverflow.com/questions/57584045/how-to-render-2d-sprites-with-specified-width-and-height-on-webgl) you hadn't finished reading [the article](https://webgl2fundamentals.org/webgl/lessons/webgl-2d-matrices.html). This question follows the same pattern since your shader is from the top of the article when the entire point of the article is to simplify the shader to just

```
in vec2 a_position;

uniform mat3 u_matrix;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
```

Once you do that it's easy to adjust more things just by changing the matrix you pass in. With the way you have it in your question the projection is hard coded so it's arguably better to do it with matrices.

The article ends with computing a matrix like this

    var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m3.translate(matrix, translation[0], translation[1]);
    matrix = m3.rotate(matrix, rotationInRadians);
    matrix = m3.scale(matrix, scale[0], scale[1]);

That first part

    var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);

defines how many units are represented across the canvas. By setting it like it is above it's always the same number as the size the canvas is displayed so that something that is 10 units wide will be 10 pixels on the page regardless of the size of the canvas.

If you want everything in the canvas to scale when you change its size then you need to choose how many units to fit in the canvas yourself. Something like

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var unitsDownCanvas = 100;
    var unitsAcrossCanvas = unitsDownCanvas * aspect;
    var matrix = m3.projection(unitsAcrossCanvas, unitsDownCanvas);

Now there will be 100 units down the canvas regardless of what size the canvas is displayed.

As for scaling the sprites the `scale` line from the code above chooses the scale

    var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m3.translate(matrix, translation[0], translation[1]);
    matrix = m3.rotate(matrix, rotationInRadians);
    matrix = m3.scale(matrix, scale[0], scale[1]);   // this line

After that generally you'd draw textures with sprites so you'd [pass texture coordinates to your fragment shader and render with textures](https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html)

If you want a flexible 2D sprite function the series goes on to make one [here](https://webgl2fundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html). It also covers 3D sprites [here](https://webglfundamentals.org/webgl/lessons/webgl-text-texture.html)

Also some other answers doing sprites in webgl

https://stackoverflow.com/questions/47565382/webgl-animated-sprites-animated-coordinates

https://stackoverflow.com/questions/42689157/how-does-sprite-animation-with-webgl-work
