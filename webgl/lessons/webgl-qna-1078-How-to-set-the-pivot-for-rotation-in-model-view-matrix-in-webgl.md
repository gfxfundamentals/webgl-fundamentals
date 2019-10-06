Title: How to set the pivot for rotation in model view matrix in webgl
Description:
TOC: qna

# Question:

I study this rotation code from webgl fundamentals, It rotates the object around the 0 0 origin. https://jsfiddle.net/eguneys/5s7n82pt/6/. I wrote exactly the same code myself and when I rotate, it rotates around the middle point (width / 2, height / 2) and it doesn't rotate correctly, it skews and just doesn't work.

So my question would be why does that happen, and How do I rotate this example code around the middle point.

    in vec2 a_position;
    
    // Used to pass in the resolution of the canvas
    uniform vec2 u_resolution;
    
    // A matrix to transform the positions by
    uniform mat3 u_matrix;
    
    // all shaders have a main function
    void main() {
      // Multiply the position by the matrix.
      vec2 position = (u_matrix * vec3(a_position, 1)).xy;
    
      // convert the position from pixels to 0.0 to 1.0
      vec2 zeroToOne = position / u_resolution;
    
      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;
    
      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;
    
      gl_Position = vec4(clipSpace, 0, 1);
    }

# Answer

The article you got that shader from this clearly [this article](https://webgl2fundamentals.org/webgl/lessons/webgl-2d-matrices.html)

You apparently didn't finish reading the article because that shader is from the top of the article and the entire point of the article is that that shader can be reduced to just

```
#version 300 es

in vec2 a_position;

uniform mat3 u_matrix;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
```

It points out why that's better, one of the reasons being you can move the pivot point without having the change the shader. It gives an example where it changes the pivot of its example model

It's starts with code like this where the model rotates around its local origin which is the top left corner of the model

    var translationMatrix = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(rotationInRadians);
    var scaleMatrix = m3.scaling(scale[0], scale[1]);

    // Multiply the matrices.
    var matrix = m3.multiply(translationMatrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);

And moves the pivot to the center of the model, the model being 100 units wide and 150 units tall, like this.

    var translationMatrix = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(rotationInRadians);
    var scaleMatrix = m3.scaling(scale[0], scale[1]);

    // make a matrix that will move the origin of the 'F' to its center.
    var moveOriginMatrix = m3.translation(-50, -75);
    ...
 
    // Multiply the matrices.
    var matrix = m3.multiply(translationMatrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
    matrix = m3.multiply(matrix, moveOriginMatrix);

Further down it simplifies those functions so you can do this

    // Multiply the matrices.
    var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m3.translate(matrix, x, y);
    matrix = m3.rotate(matrix, angle);
    matrix = m3.scale(matrix, sx, sy);
    matrix = m3.translate(matrix, centerOffsetX, centerOffsetY);

That series also follows up with both [matrix stacks](https://webgl2fundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html) basically reproducing the canvas 2d matrix system and also [scene graphs](https://webgl2fundamentals.org/webgl/lessons/webgl-scene-graph.html) which most 3D engines use. Structured drawing systems like SVG and apps like Illustrator also use scene graphs. Both matrix stacks and scene graphs also make it easy to change a rotation pivot point.
