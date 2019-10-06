Title: Shaders in WebGL vs openGL?
Description:
TOC: qna

# Question:

I want to use shaders to use in WebGL and specifically three.js. Is there a specific version of GLSL that WebGL and three.js uses?

# Answer

WebGL shaders follow the GLSL ES 1.017 spec

https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

That's different than Desktop OpenGL in several ways. One it's the 1.0 version of GLSL ES where as desktop GL at version 4.2 of GLSL (not ES)

One big difference between WebGL GLSL and many articles found about shaders on the internet is there's no fixed function pipeline in OpenGL ES 2.0 and therefore no fixed function pipeline in WebGL. 

The fixed function pipeline is left over from OpenGL 1.0 where you'd use commands like `glLight` and `glVertex` and `glNormal`. And then your shaders needed a way to reference that data. In OpenGL ES and WebGL all that is gone because everything a shader does is 100% up to the user. All WebGL does is let you define your own inputs (attributes, uniforms) and name them whatever you want.

WebGL2 shaders follow the GLSL ES 3.00 spec

https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf

As for three.js, three.js is a 3d engine and provides its own set of standard inputs, names, and other features when it generates a shader. [See the docs](http://threejs.org/docs/#Reference/Materials/ShaderMaterial) for some of the details. [The uniforms and attributes provided by default are documented here](http://threejs.org/docs/#Reference/Renderers.WebGL/WebGLProgram). You can also [look at the source](https://github.com/mrdoob/three.js/blob/master/src/renderers/webgl/WebGLProgram.js) or [check out an example](http://threejs.org/examples/). 

Three.js also provides something called a [RawShaderMaterial](http://threejs.org/docs/#Reference/Materials/RawShaderMaterial) which does not add any predefined things apparently in which case you just write standard WebGL GLSL.

You can find three.js's standard attributes and uniforms [here][1].

As for a place to learn GLSL I don't really have a suggestion. It really depends on your level of experience with programming in general and how you like to learn. I learn by looking at examples better than reading manuals. Maybe someone else can add some links. 

[Shaders as a concept are pretty simple](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html). You create a pair of shaders, setup them up with inputs, call gl.drawArrays or gl.drawElements and pass in a count. Your vertex shader will be called count times and needs to set `gl_Position`. Every 1 to 3 times it's called WebGL will then draw a point, line, or triangle. To do this it will call your fragment shader asking for each pixel it's about to draw what color to make that pixel. The fragment shader needs to set `gl_FragColor`. The shaders get data from `attributes`, `uniforms`, `textures` and `varyings`. `attributes` are per vertex data. They pull their data from buffers, one piece of data per attribute per iteration of your vertex shader. `Uniforms` are like setting global variables before the shader runs. You can pass data from a vertex shader to a fragment shader with `varying`. That data will be interpolated *or varied ;)* between the values set for each vertex of a primitive (triangle) as the fragment shader is called to provide a color for each pixel.

It's up to you to creatively supply data to the shader and use that data creatively to set `gl_Position` and `gl_FragColor`. I get most ideas from looking at examples.

GLSL itself is pretty straight forward. There's a few types `int`, `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, `mat4`. They respond to operators `+`, `-`, `*`, `/` etc. There's some built in functions. 

You can find a terse version of all GLSL info on the last 2 pages of the [WebGL Reference Card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf).

That was enough for me. That and looking at [working programs](http://webglfundamentals.org).

The one interesting thing for me vs most languages was synonyms for vec fields and the swizzling. A vec4 for example

    vec4 v = vec4(1.0, 2.0, 3.0, 4.0);

You can reference the various components of `v` using `x,y,z,w` or `s,t,u,v` or `r,g,b,a` or array style. So for example

    float red = v.r;  // OR
    float red = v.x;  // same thing OR
    float red = v.s;  // same thing OR
    float red = v[0]; // same thing

The other thing you can do is swizzle

    vec4 color = v.bgra;   // swap red and blue
    vec4 bw    = v.ggga;   // make a monotone color just green & keep alpha

And you can also get subcomponents

    vec2 just_xy = v.xy;


  [1]: http://threejs.org/docs/#Reference/Renderers.WebGL/WebGLProgram
