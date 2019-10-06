Title: Native WebGL particle system opacity issue
Description:
TOC: qna

# Question:

I am trying to render textured particles and i have the problem.
Transparent pixels of texture doing a weird thing with render.
Looks like particles that are behing nearest (to camera) particles are not rendering at all.
But not always, some of them are rendering and look expected.
I was tried to play around with depth and blend options but without result.

Perhaps that a solution can be found by modifying this part code.

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

Variant below are fixes my problem, but does not give me needed result. Particles becomes transparent and overlap each other.

    // gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

So here is [jsfiddle](http://jsfiddle.net/mzrUm/) with my problem.

# Answer

The problem is z-buffering and the depth test.

You're drawing quads in effectively a random depth order. So, you draw a close particle first, it draws the transparent pixels on the corners of the happy face and sets the zbuffer for those pixels. Later some particles behind get drawn but the zbuffer says not to draw them.

A few solutions, each with their own issues

1.  Sort all the transparent stuff you're drawing then draw furthest to closest.

    Plus: It works

    Minus: It's really slow, especially for thousands of particles.

2.  Use an additive or other blending mode.

    Plus: works for certain cases like fire and possibly smoke

    Minus: only works for certain cases like fire and smoke

3.  Discard transparent pixels

    Change your shader to discard transparent pixels like this

        void main() {
          float alphaThreshold = 0.1;
          vec4 color = texture2D(u_sampler, gl_PointCoord);
          if (color.a <= alphaThreshold) {
            discard;
          }
          gl_FragColor = color;
        }

    Plus: Works for opaque textures with 100% transparent pixels

    Minus: Doesn't truly work for anti-aliased less than 100% transparent pixels.

If you [try #3 on your sample you'll see it mostly works](http://jsfiddle.net/greggman/E6K3w/) but when particles are really large you can still see the issue on the semi-transparent pixels that still pass the `alphaThreshold` test. You can change the `alphaThreshold` to a higher number to discard more pixels and it might look better or worse. 

Also just FYI: Be aware that GL has an implementation dependent limit on how large `POINTS` can be so your sample will not work as intended on many implementations. You might want to consider switching to [quad based particles](https://stackoverflow.com/questions/23048899/particle-system-using-webgl/23056518#23056518).

