Title: Optimizing branching for lookup tables
Description:
TOC: qna

# Question:

Branching in WebGL seems to be something like the following (paraphrased from various articles):

The shader executes its code in parallel, and if it needs to evaluate whether a condition is true before continuing (e.g. with an `if` statement) then it must _diverge_ and somehow communicate with the other threads in order to come to a conclusion.

Maybe that's a bit off - but ultimately, it seems like the problem with branching in shaders is when each thread may be seeing different data. Therefore, branching with uniforms-only is typically okay, whereas branching on dynamic data is not.

**Question 1: Is this correct?**

**Question 2: How does this relate to something that's fairly predictable but not a uniform, such as an index in a loop?**

Specifically, I have the following function:

    vec4 getMorph(int morphIndex) {
      /* doesn't work - can't access morphs via dynamic index
      vec4 morphs[8];
      morphs[0] = a_Morph_0;
      morphs[1] = a_Morph_1;
      ...
      morphs[7] = a_Morph_7;
      
      return morphs[morphIndex];
      */
    
      //need to do this:
    
      if(morphIndex == 0) {
         return a_Morph_0;
      } else if(morphIndex == 1) {
         return a_Morph_1;
      }
      ...
      else if(morphIndex == 7) {
         return a_Morph_7;
      }
     
    }

And I call it in something like this:

    for(int i = 0; i < 8; i++) {
      pos += weight * getMorph(i);
      normal += weight * getMorph(i);
      ...
    }

Technically, it works fine - but my concern is all the if/else branches based on the dynamic index. Is that going to slow things down in a case like this?

For the sake of comparison, though it's tricky to explain in a few concise words here - I have an alternative idea to always run all the calculations for each attribute. This would involve potentially 24 superfluous `vec4 += float * vec4` calculations per vertex. Would that be better or worse than branching 8 times on an index, usually?

_note: in my actual code there's a few more levels of mapping and indirection, while it does boil down to the same `getMorph(i)` question, my use case involves getting that index from both an index in a loop, and a lookup of that index in a uniform integer array_

# Answer

I know this is not a direct answer to your question but ... why not just not use a loop?  

    vec3 pos = weight[0] * a_Morph_0 + 
               weight[1] * a_Morph_1 + 
               weight[2] * a_Morph_2 ...

If you want generic code (ie where you can set the number of morphs) then either get creative with `#if`, `#else`, `#endif`

    const numMorphs = ?
    const shaderSource = `
    ...
    #define NUM_MORPHS ${numMorphs}

    vec3 pos = weight[0] * a_Morph_0
               #if NUM_MORPHS >= 1
               + weight[1] * a_Morph_1 
               #endif
               #if NUM_MORPHS >= 2
               + weight[2] * a_Morph_2 
               #endif
               ;
    ...
    `;

or generate the shader in JavaScript with string manipulation.

     function createMorphShaderSource(numMorphs) {
       const morphStrs = [];
       for (i = 1; i < numMorphs; ++i) {
          morphStrs.push(`+ weight[${i}] * a_Morph_${i}`);
       }
       return `
         ..shader code..
         ${morphStrs.join('\n')}
         ..shader code..
       `;
     }

Shader generation through string manipulation is a normal thing to do. You'll find all major 3d libraries do this (three.js, unreal, unity, pixi.js, playcanvas, etc...)

As for whether or not branching is slow it really depends on the GPU but the general rule is that yes, it's slower no matter how it's done. 

You generally can avoid branches by writing custom shaders instead of trying to be generic.

Instead of

    uniform bool haveTexture;

    if (haveTexture) {
       ...
    } else {
       ...
    }

Just write 2 shaders. One with a texture and one without.

Another way to avoid branches is to get creative with your math. For example let's say we want to support vertex colors or textures

    varying vec4 vertexColor;
    uniform sampler2D textureColor;

    ...

    vec4 tcolor = texture2D(textureColor, ...);
    gl_FragColor = tcolor * vertexColor;

Now when we just want just a vertex color set `textureColor` to a 1x1 pixel white texture. When we just want just a texture turn off the attribute for `vertexColor` and set that attribute to white `gl.vertexAttrib4f(vertexColorAttributeLocation, 1, 1, 1, 1)`; and *bonus!*, we can modulate the texture with vertexColors by supplying both a texture and vertex colors.

Similarly we could pass in a 0 or a 1 to multiply certain things by 0 or 1 to remove their influence. In your morph example, a 3d engine that is targeting performance would generate shaders for different numbers of morphs. A 3d engine that didn't care about performance would have 1 shader that supported N morph targets just set the weight to 0 for any unused targets to 0.

Yet another way to avoid branching is the `step` function which is defined as

    step(edge, x) {
      return x < edge ? 0.0 : 1.0;
    }

So you can choose `a` or `b` with

    v = mix(a, b, step(edge, x));


