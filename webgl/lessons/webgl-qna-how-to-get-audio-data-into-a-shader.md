Title: How to get audio data into a shader
Description: How to get audio data into a shader
TOC: How to get audio data into a shader

## Question:

How can i add Audio Visualization support to this class, i would like to add an Audio() object as an input to a GLSL Fragment Shader. An Example of this is https://www.shadertoy.com/view/Mlj3WV. I know this sort of thing can be done in Canvas 2d with waveform Analysis, but this opengl method is far more smooth.


```
/* Code from https://raw.githubusercontent.com/webciter/GLSLFragmentShader/1.0.0/GLSLFragmentShader.js */

/* render function */

/* set the uniform variables for the shader */
 gl.uniform1f( currentProgram.uniformsCache[ 'time' ], parameters.time / 1000 );
gl.uniform2f( currentProgram.uniformsCache[ 'mouse' ], parameters.mouseX, parameters.mouseY );

/* i would like something like this */
gl.uniform2f( currentProgram.uniformsCache[ 'fft' ], waveformData );


```

The shader at ShaderToy Example accepts a float as fft, but this just updates the entire row of bars and not individual bar values. I would like real time manipulation of all bars.

Iv searched MDN but don't understand how to incorporate this, iv also looked at the source code of shadertoy.com but can't figure out how they have achieved this.

## Answer:

Shadertoy does not provide FFT as a float. It provides FFT data as a texture


{{{example url="../webgl-qna-how-to-get-audio-data-into-a-shader-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/11527891">David Clews</a>
    from
    <a data-href="https://stackoverflow.com/questions/57125984">here</a>
  </div>
</div>
