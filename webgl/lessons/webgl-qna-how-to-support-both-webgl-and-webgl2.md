Title: How to support both WebGL and WebGL2
Description: How to support both WebGL and WebGL2
TOC: How to support both WebGL and WebGL2

## Question:

I have a certain library that uses WebGL1 to render things.
It heavily uses float textures and instanced rendering.

Nowadays it seems like support for WebGL1 is pretty weird, with some devices supporting for example WebGL2, where these extensions are core, but not supporting WebGL1, or supporting it, but not the extensions.

At the same time, support for WebGL2 isn't amazing. Maybe one day it will be, but for not it isn't.

I started looking at what it will take to support both versions.

For shaders, I think I can mostly get away with `#define`ing things. For example, `#define texture2D texture` and other similar things.

When it comes to extensions, it becomes more problematic, since the extension objects no longer exist.
As an experiment, I tried copying the extension properties into the context object, e.g. `gl.drawArraysInstanced = (...args) => ext.drawArraysInstancedANGLE(...args)`.

When it comes to textures, not much needs to be changed, perhaps add something like `gl.RGBA8 = gl.RGBA` when running in WebGL1, thus it will "just work" when running in WebGL2.

So then comes the question...did anyone try this?
I am worried about it hurting performance, especially the extra indirection for function calls.
It will also make reading the code less obvious if the assumption is that it can run in WebGL1. After all, no WebGL1 context has `drawArraysInstanced`, or `RGBA8`. This also bothers Typescript typing and other minor things.

The other option is to have branches all over the code. Two versions of shaders (or `#ifdef` trickery), lots of brancing for every place where texture formats are needed, and every place where instancing is done.
Having something like what follows all over the place is pretty ugly:

    if (version === 1) {
      instancedArrays.vertexAttribDivisorANGLE(m0, 1);
      instancedArrays.vertexAttribDivisorANGLE(m1, 1);
      instancedArrays.vertexAttribDivisorANGLE(m2, 1);
      instancedArrays.vertexAttribDivisorANGLE(m3, 1);
    } else {
      gl.vertexAttribDivisor(m0, 1);
      gl.vertexAttribDivisor(m1, 1);
      gl.vertexAttribDivisor(m2, 1);
      gl.vertexAttribDivisor(m3, 1);
    }

Finally, maybe there's a third way I didn't think about.

Got any recommendations?

## Answer:

Unfortunately I think most answers will be primarily opinion based.

The first question is why support both? If your idea runs fine on WebGL1 then just use WebGL1. If you absolutely must have WebGL2 features then use WebGL2 and realize that many devices don't support WebGL2 and that Safari doesn't yet support WebGL2 (September 2020) <s>and may never support WebGL2</s> though it appears to finally be arriving

If you're intent on doing it [twgl](https://twgljs.org) tries to make it easier by [providing a function that copies all the WebGL1 extensions into their WebGL2 API positions](http://twgljs.org/docs/module-twgl.html#.addExtensionsToContext). For like you mentioned, instead of 

    ext = gl.getExtension('ANGLE_instanced_arrays');
    ext.drawArraysInstancedANGLE(...)

You instead do

    twgl.addExtensionsToContext(gl);
    gl.drawArraysInstanced(...);

I don't believe there will be any noticeable perf difference. Especially since those functions are only called a few hundred times a frame the wrapping is not going to be the bottleneck in your code.

The point though is not really to support WebGL1 and WebGL2 at the same time. Rather it's just to make it so the way you write code is the same for both APIs.

Still, there are real differences in the 2 APIs. For example to use a FLOAT RGBA texture in WebGL1 you use

    gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, ...)

In WebGL2 it's

    gl.texImage2D(target, level, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, ...)

WebGL2 will fail if you try to call it the same as WebGL1 in this case. [There are other differences](https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html) as well.

Will work just fine in WebGL1 and WebGL2. The spec specifically says that combination results in RGBA8 on WebGL2.

Note though that your example of needing RGBA8 is not true. 

    gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, ...)

The biggest difference though is there is no reason to use WebGL2 if you can get by with WebGL1. Or, visa versa, if you need WebGL2 then you probably can not easily fall back to WebGL1

For example you mentioned using defines for shaders but what are you going to do about features in WebGL2 that aren't in WebGL1. Features like `textureFetch` or the mod `%` operator, or integer attributes, etc.... If you need those features you mostly need to write a WebGL2 only shader. If you don't need those features then there was really no point in using WebGL2 in the first place.

Of course if you really want to go for it maybe you want to make a fancier renderer if the user has WebGL2 and fall back to a simpler one if WebGL1. 

TD;LR IMO Pick one or the other

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/2503048">user2503048</a>
    from
    <a data-href="https://stackoverflow.com/questions/59490319">here</a>
  </div>
</div>
