Title: The Graphics Technology Browsers Use Under the Hood
Description:
TOC: qna

# Question:

I know I have seen this somewhere for WebKit but can't seem to find it. I would also like to know for iOS/Android/IE the graphics technology used.

Basically, how they are implementing their 3D WebGL support, some library they are using on top of OpenGL perhaps.

# Answer

Every browser is different. As of 2018 Safari/Webkit calls into OpenGL on the Mac. I believe Chrome and Firefox use [ANGLE](https://github.com/google/angle). It used to be they used it only on Windows but as of their support for WebGL2 I believe both of them use it on all platforms. No idea what Edge or IE do.

ANGLE itself can use OpenGL, OpenGL ES, DirectX 9, DirectX 11, and who knows in the future.
