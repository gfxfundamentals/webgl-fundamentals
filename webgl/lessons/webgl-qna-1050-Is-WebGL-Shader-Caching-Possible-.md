Title: Is WebGL Shader Caching Possible?
Description:
TOC: qna

# Question:

My question is similar to [Saving/Loading compiled WebGL shaders][1], but I don't want to pre-compile my shaders. Instead, I just want the browser to store the shaders it compiles longer than the default. Right now, every time I refresh the page the shaders have to be recompiled.

I understand the security and portability issues raised in answers like [this one][2] and [this one][3]. It seems that these are both non-issues assuming that the browser is caching shaders that it compiled for my web app.

Assuming the same OS + browser + GPU + driver combination, is there a way to make the browser cache compiled shaders in such a way that shader compilation will not be required after each time the page is refreshed?


  [1]: https://stackoverflow.com/q/36018753/3517452
  [2]: https://stackoverflow.com/a/10724212/3517452
  [3]: https://stackoverflow.com/a/53549882/3517452

# Answer

There is nothing the user can do to force the browser to cache shaders. It's up to the browser to implement shader caching and to decide when to use it. Further, the browser relies on the OS to provide a way to cache shaders so if the OS doesn't support it then of course the browser can't either. As an example, currently on MacOS, WebGL runs on top of OpenGL and OpenGL on MacOS provides no way to cache shaders.

For example search for 'BINARY' in [this official Apple OpenGL feature table](https://developer.apple.com/opengl/OpenGL-Capabilities-Tables.pdf) and you'll see the number of formats for caching is 0. In other words you can't cache OpenGL shaders on MacOS

I don't know Metal that well, it possible that some future version of WebGL could be written on top of Metal and maybe Metal provides a way.

Chrome can cache shaders. [Here's the code for caching them](https://cs.chromium.org/chromium/src/gpu/ipc/host/shader_disk_cache.h?sq=package:chromium&g=0). But it can't if the OS doesn't support it.

Then there's the question of when to clear or not use the cache. Should the cache be cleared if the user presses 'refresh'. Note that 'refresh' is a signal from the user to NOT cache the page. There are many ways to revisit. One, click a link to the page again, pick it from a bookmark, enter it in the URL bar. All of these don't clear the cache. Clicking the 'Refresh' button AFAIK ignores the cache for at least the specific request (ie, the page itself) but not the things the page references.

Should the cache be cleared if the user picks to empty the browser's normal cache of web resources? Clearly the cache should be cleared anytime the driver changes version numbers. There may be other reasons to clear the cache as the browser needs to make sure it never delivers a bad or out of date shader.

As for Windows I believe DirectX allows caching shaders and Chrome, via [ANGLE](https://chromium.googlesource.com/angle/angle/+/master/README.md) caches them. A quick test on Windows seems to bare this out. Going to [shadertoy.com](shadertoy.com) the first time I load the page it takes a while. The next time it doesn't. Another test. Pick a complex shader on shadertoy. Edit some constant in the shader, for example change 1.0 to 1.01 and press the compile button. Look at the compile time. Now change it back to 1.0 and press compile. In my tests the second compile takes much less time suggesting the shader was cached.

I have no idea if Firefox caches shaders. Safari doesn't since it only runs on platforms that don't support caching.
