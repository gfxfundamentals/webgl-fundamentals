Title: Webgl Cross Origin Images don't work
Description:
TOC: qna

# Question:

I've got some problem with cross-origin image and I hope you can help.

Here the beahviour.
I've got 2 domains, in example:
- domain1.com
- domain2.com

On domain1 I put many html5 games. This domain is only a repository of games.

Domain2 is the real website (wordpress website) where users can play games hosted on domain1.
To doing this I made a curl request for every game.

In domain1 nginx configuration file I put these lines of code for enabling Cross Origin Resource Sharing:

<pre>

    location ~* \.(ogg|ogv|svg|svgz|eot|otf|woff|mp4|ttf|css|rss|atom|json|js|jpg|jpeg|gif|png|ico|zip|tgz|gz|rar|bz2|doc|xls|exe|ppt|tar|mid|midi|wav|bmp|rtf|swf|mp3|xml|woff2)$ {
        add_header "Access-Control-Allow-Origin" "*";
        access_log off;
        log_not_found off;
        expires max;
    }

</pre>

This resolved some issues for many games but some games are still not working and I get this js error:

<pre>

    Uncaught DOMException: Failed to execute 'texImage2D' on 'WebGLRenderingContext': The cross-origin image at http://domain1.com/html5-games/action/candy-match/images/loadingbarbackground-sheet0.png may not be loaded.
        at GLWrap_.loadTexture (http://domain1.com/html5-games/action/candy-match/c2runtime.js:2618:16)
        at pluginProto.Type.typeProto.loadTextures (http://domain1.com/html5-games/action/candy-match/c2runtime.js:18070:46)
        at pluginProto.Instance.instanceProto.onCreate (http://domain1.com/html5-games/action/candy-match/c2runtime.js:18146:13)
        at Runtime.createInstanceFromInit (http://domain1.com/html5-games/action/candy-match/c2runtime.js:4806:8)
        at Layer.createInitialInstances (http://domain1.com/html5-games/action/candy-match/c2runtime.js:7541:25)
        at Layout.startRunning (http://domain1.com/html5-games/action/candy-match/c2runtime.js:6715:10)
        at Runtime.go_loading_finished (http://domain1.com/html5-games/action/candy-match/c2runtime.js:4067:36)
        at Runtime.go (http://domain1.com/html5-games/action/candy-match/c2runtime.js:3966:9)
        at http://domain1.com/html5-games/action/candy-match/c2runtime.js:4025:60

</pre>

I made some research online and I found articles like these
https://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html
https://stackoverflow.com/questions/23123237/drawing-images-to-canvas-with-img-crossorigin-anonymous-doesnt-work

but they are not very helpful.

I wouldn't like to modify original game files. I'm looking for a server side solution if it exists. If not, have you got some idea for resolve my problem?

Is there some error in my configuration? Am I missing something?

Thank you for the help.

Valerio

# Answer

The games have to request cross origin images. Simply returning the correct headers is not enough. If the games themselves don't request cross origin images by setting the `crossOrigin` attribute then the browser will not allow the images to be used even if they have the correct headers.

Here's an example

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    loadImage('https://i.imgur.com/ZKMnXce.png', false);
    loadImage('https://i.imgur.com/u6VI8xz.jpg', true);

    function loadImage(url, crossOrigin) {
      const img = new Image();
      img.onload = () => { upload(img); };
      if (crossOrigin) {
        img.crossOrigin = '';
      }
      img.src = url;
    }

    function upload(img) {
      // trap for cors error
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        log(img.src, "uploaded image");
      } catch (e) {
        log(img.src, e);
      }
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- end snippet -->

And here you can see even those the first image returned the CORS headers it was not allowed to be used because `crossOrigin` was not set

[![enter image description here][1]][1]

The second image has the same headers but it works because we set the `crossOrigin` attribute

[![enter image description here][2]][2]


Note that you **might** be able to include a script like this before the game scripts to kind of hack in CORS support. 

    (function() {
    
    function isSameOrigin(url) {
      return (new URL(url)).origin === window.location.origin;
    }
    
    function needsCORS(url) {
      // not sure all the URLs that should be checked for
      return !isSameOrigin(url) && !url.startsWith("blob:") && !url.startsWith("data:");
    }
    
    const srcSetFn = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set; 
    
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      enumerable: true,
      set: function(url) {
         if (needsCORS(url)) {
           // Set if not already set
           if (this.crossOrigin !== undefined) {
             this.crossOrigin = '';
           }
         } else {
           this.crossOrigin = undefined;
         }
         // Set the original attribute
         srcSetFn.call(this, url);
      },
    });
    
    }());

  [1]: https://i.stack.imgur.com/ENcx0.png
  [2]: https://i.stack.imgur.com/udGGG.png

