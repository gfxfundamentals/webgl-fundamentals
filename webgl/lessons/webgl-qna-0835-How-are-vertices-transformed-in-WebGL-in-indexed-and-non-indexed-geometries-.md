Title: How are vertices transformed in WebGL in indexed and non-indexed geometries?
Description:
TOC: qna

# Question:

I am trying to digest these two links:

https://www.khronos.org/opengl/wiki/Rendering_Pipeline_Overview
https://www.khronos.org/opengl/wiki/Vertex_Shader


The pipeline overview says that vertex shader runs before the primitive assembly. 

The second one mentions this:

>A vertex shader is (usually) invariant with its input. That is, within a single Drawing Command, **two vertex shader invocations that get the exact same input attributes will return binary identical results**. Because of this, if OpenGL can detect that a vertex shader invocation is being given the same inputs as a previous invocation, it is allowed to reuse the results of the previous invocation, instead of wasting valuable time executing something that it already knows the answer to.

>OpenGL implementations generally do not do this by actually comparing the input values (that would take far too long). Instead, this optimization typically only happens when using indexed rendering functions. **If a particular index is specified more than once (within the same Instanced Rendering), then this vertex is guaranteed to result in the exact same input data.**

>Therefore, implementations employ a cache on the results of vertex shaders. **If an index/instance pair comes up again, and the result is still in the cache**, then the vertex shader is not executed again. **Thus, there can be fewer vertex shader invocations than there are vertices specified**.


So if i have two quads with two triangles each:

indexed:

    verts: { 0 1 2 3 }
    tris:  { 0 1 2 }
             { 1 2 3 }


soup:

    verts: { 0 1 2 3 4 5 }
    tris:  { 0 1 2 } 
                 { 3 4 5 }

and perhaps a vertex shader that looks like this:



    uniform mat4 mvm;
    uniform mat4 pm;
    
    attribute vec3 position;
    
    void main (){
      vec4 res;
      for ( int i = 0; i < 256; i++ ){
         res = pm * mvm * vec4(position,1.);
      }
    gl_Position = res;


**Should I care that one has 4 vertices while the other one has 6?** Is this even true from gpu to gpu, will one invoke the vertex shader 4 times vs 6? How is this affected by the cache:

> If an index/instance pair comes up again, **and the result is still in the cache**...

How is the primitive number related to performance here? In both cases i have the same amount of primitives. 

In the case of a very simple fragment shader, but an expensive vertex shader:

    void main(){
      gl_FragColor = vec4(1.);
    }

And a tessellated quad (100x100 segments) can i say that the indexed version **will** run faster, or **can** run faster, or maybe say **nothing**? 



# Answer

Like everything in GPUs according to the spec you can say nothing. It's up to the driver and GPU. In reality though in your example 4 vertices will run faster than 6 pretty much everywhere?

Search for vertex order optimization and lots of articles come up

[Linear-Speed Vertex Cache Optimisation](https://tomforsyth1000.github.io/papers/fast_vert_cache_opt.html)

[Triangle Order Optimization](http://gameangst.com/?p=9)

[AMD Triangle Order Optimization Tool](https://github.com/GPUOpen-Tools/amd-tootle)

[Triangle Order Optimization for Graphics Hardware Computation Culling](http://gfx.cs.princeton.edu/pubs/Nehab_2006_TOO/index.php)

unrelated but another example of the spec vs realtiy is that according to the spec depth testing happens AFTER the fragment shader runs (otherwise you couldn't set `gl_FragDepth` in the fragment shader. In reality though as long as the results are the same the driver/GPU can do whatever it wants so fragment shaders that don't set `gl_FragDepth` or `discard` certain fragments are depth tested first and only run if the test passes.
