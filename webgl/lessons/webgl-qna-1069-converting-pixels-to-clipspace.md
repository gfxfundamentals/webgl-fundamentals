Title: converting pixels to clipspace
Description:
TOC: qna

# Question:

Instead of giving -1 to 1 values to my shaders, I would prefer giving them pixel values like for the 2D canvas context. So according to what I read, I did add a uniform variable which I set to the size of the canvas, and I divide.

But I must be missing something. The rendering is way too big...

```lang-js
gl_.resolutionLocation = gl.getUniformLocation( gl_.program , "u_resolution" );
gl.uniform4f(gl_.resolutionLocation , game.w , game.h , game.w , game.h );
```

My vertex shader :

```glsl
attribute vec4 position;
attribute vec2 texcoord;
uniform vec4 u_resolution;
uniform mat4 u_matrix;
varying vec3 v_texcoord;

void main() {
    vec4 zeroToOne = position / u_resolution ;
 gl_Position = u_matrix * zeroToOne ;
 v_texcoord = vec3(texcoord.xy, 1) * abs(position.x);
 v_texcoord = v_texcoord/u_resolution.xyz ;
}
```

My fragment shader :

```glsl
precision mediump float;
varying vec3 v_texcoord;
uniform sampler2D tex;
uniform float alpha;

void main()
{
    gl_FragColor = texture2DProj(tex, v_texcoord);
 gl_FragColor.rgb *= gl_FragColor.a ;
}


# Answer

If you want to stay in pixels with code like the code you have then you'd want to apply the conversion to clip space after you've done everything in pixels.

In other words the code would be something like

     rotatedPixelPosition = rotationMatrix * pixelPosition
     clipSpacePosition = (rotatedPixelPosition / resolution) * 2.0 - 1.0; 

So in other words you'd want

    vec4 rotatedPosition = u_matrix * position;
    vec2 zeroToOne = rotatedPosition.xy / u_resolution.xy;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 minusOneToPlusOne = zeroToTwo - 1.0;
    vec2 clipspacePositiveYDown = minusOneToPlusOne * vec2(1, -1);
    gl_Position = vec4(clipspacePositiveYDown, 0, 1);

If you do that and you set u_matrix to the identity then if position is in pixels you should see those positions at pixel positions. If u_matrix is strictly a rotation matrix the positions will rotate around the top left corner since rotation always happens around 0 and the conversion above puts 0 at the top left corner.

But really here's no reason to convert to from pixels to clip space by hand. You can instead convert and rotate all in the same matrix. [This article](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) covers that process. It starts with translate, rotation, scale, and converting from pixels to clip space with no matrices and converts it to something that does all of that combined using a single matrix.

Effectively

      matrix = scaleYByMinusMatrix *
               subtract1FromXYMatrix *
               scaleXYBy2Matrix *
               scaleXYBy1OverResolutionMatrix *
               translationInPixelSpaceMatrix *
               rotationInPixelSpaceMatrix *
               scaleInPixelSpaceMatrix;

And then in your shader you only need

    gl_Position = u_matrix * vec4(position, 0, 1);  
 
Those top 4 matrixes are easy to compute as a single matrix, often called an orthographic projection in which case it simplifies to

      matrix = projectionMatrix *
               translationInPixelSpaceMatrix *
               rotationInPixelSpaceMatrix *
               scaleInPixelSpaceMatrix;

There's also [this article](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html) which reproduces the matrix stack from canvas2D in WebGL
