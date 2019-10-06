Title: Is it possible to run Three.js WebGLRenderer on node.js server?
Description:
TOC: qna

# Question:

I am in need of running WebGLRenderer on the server, but there are different voices regarding this. Some say that it's not possible and some say they are _trying_ to get it working, but that's when the discussions end.

Is it possible to do it and in that case, what is the approach? Is it possible using moch-browser combined with node-gl or something?


[edit]
Added solution

# Answer

You could try [headless-gl](https://github.com/stackgl/headless-gl) but you'd need to use some other libraries to emulate the DOM and Image tags (for texture loading) and Canvas tags and/or Canvas2D if you need that as well.

Otherwise you could [shell to a browser running on top of OSMESA](https://stackoverflow.com/a/39060739/128511) maybe or try [headless chromium](https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md)


