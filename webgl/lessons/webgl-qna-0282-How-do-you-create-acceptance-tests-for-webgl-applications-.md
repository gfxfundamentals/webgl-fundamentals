Title: How do you create acceptance tests for webgl applications?
Description:
TOC: qna

# Question:

I don't think selenium/webdriver is going to work out here (for obvious reasons). Are there any techniques for acceptance testing webgl (even opengl) style applications beyond unit testing?

This application functions more like photoshop and less like a game.

# Answer

Why won't selenium work? We used it on O3D to test graphics. You can take screenshots from selenium and use perceptual diff. There are something things to be aware of. You probably want to test with anti-aliasing off because how each GPU anti-aliases is different. Similarly interpolation is GPU dependent so you need to test solid colors, simple textures, turn off filtering if you can for your tests. Or else check individual pixels in known "safe" areas meaning areas where you know it should render the same regardless of GPU.

You can also take a look at the [WebGL Conformance Tests](https://www.khronos.org/registry/webgl/sdk/tests/webgl-conformance-tests.html). They run in the browser both Chrome, Firefox, and Safari all have them running in their builds as just another example of testing WebGL.

Also [see how to run Chrome using osmesa](https://stackoverflow.com/a/39060739/128511) (for running tests on machines without GPUs). Note it will be sssssllllloooowwww so need to design your tests well.
