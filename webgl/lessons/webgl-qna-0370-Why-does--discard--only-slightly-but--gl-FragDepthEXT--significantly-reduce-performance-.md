Title: Why does "discard" only slightly but "gl_FragDepthEXT" significantly reduce performance?
Description:
TOC: qna

# Question:

From what I've read so far, using discard or changing the depth value inside a fragment shader will disable the early depth testing and therefore reduce the shader performance.

Now I've got an app where using discard only has a minor impact but changing the depth value severely reduces the performance:
http://potree.org/demo/experimental/early_depth/examples/philly.html
(increase point size and zoom in if it's too fast for you)

* Setting quality to "Circles" will call discard in order to render points as circles.
* Setting quality to "Interpolation" will change the fragment depth values.

I've got these results:

* Squares: 55fps
* Circles: 52fps
* Interpolation: 30fps

When using interpolation, some additional stuff happens but I've already checked that it is "gl_FragDepthEXT = ..." with any kind of value that affects the performance. 


# Answer

The spec basically says the depth test happens after the fragment shader has processed. But, the spec makes it clear that if the results won't be affected an implementation is allowed to do things in any order.

So, `gl_fragDepthEXT`,  Normally it's best to draw opaque stuff in the front before things in the back because the GPU can do a depth test BEFORE it runs the fragment shader. If the depth test fails it doesn't have to run the fragment shader. Setting `gl_fragDepthEXT` though changes that because it can't do the depth test until after it runs the fragment shader since by setting `gl_fragDepthEXT` you've told it you're going to decide the depth value. 

To put it another way, when you're NOT using `gl_FragDepthEXT` many pixels never have to have their fragment shader run because an early depth test rules them out. In the other case, where you use `gl_FragDepthEXT` every pixel has to have the fragment shader run because the GPU can't do the depth test until after you've told it what depth value you're computing.

As for `discard` I've never personally seen it take more time. Maybe it's more time compared to what? If you've got a branch `if (cond) discard;` then you'd need to at least compare it to a shader with similar branch `if (cond) color = red;` or something along those lines
