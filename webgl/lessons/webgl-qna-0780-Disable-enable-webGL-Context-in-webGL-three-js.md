Title: Disable/enable webGL Context in webGL/three.js
Description:
TOC: qna

# Question:

I have a cool project with three.js, and everything work as intended. It displays some mesh in different canvas, and there is my issue.

The project aimed to display many, many canvas, and each one have his own context, and it reach the deadly limit of 16 live webGL contexts. Since it's wanted to display more than that in a page, I'm searching to turn around this restriction, by disabling a context when it's not actually displayed on seen page. When the user will scroll, context will be disabled/enabled so I can put as many context as I want.

I've found this function : `renderer.forceContextLoss()` and with this one I can force the context disabling. But I didn't found anything to relaunch it. I manage to detect a loss of context, but not its restauration

If you got any idea of how I can achieve that, feel free to give me some tips.

Thanks in advance !

# Answer

This has been covered elsewhere but the easiest way to make it appear like there are multiple canvases is to just use one instance of three.js, make it cover the entire window, put place holder divs where you want to draw things, and then use `element.getClientBoundingRect` to set the scissor and viewport for each scene you want to draw in each element

[There's an example here](http://threejs.org/examples/webgl_multiple_elements.html). 

Here's the answer in StackOverflow from which that sample originates

https://stackoverflow.com/a/30633132/128511

This will use far less memory than using multiple canvases, each of which would need it's own data, it's own shaders, etc...
