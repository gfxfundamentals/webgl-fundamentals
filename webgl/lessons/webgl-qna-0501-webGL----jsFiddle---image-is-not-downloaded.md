Title: webGL && jsFiddle - image is not downloaded
Description:
TOC: qna

# Question:

I'm trying to work with webGL on jsFiddle but I'm not able to download and use an image in code. Everything works just fine running page with my example on localhost but jsFiddle is not accepting image. I would love to share my code online but I'm not able to..  

This is how I'm downloading image into script:  

    var image = document.createElement("img");
    image.src = "http://s29.postimg.org/ct644q1dz/sp_dom1.jpg";
    image.onload = function() {
            // some magic :P
            ...
    }; 


<a href="https://jsfiddle.net/bimbochobot/echsqkaw/10/">There</a> is example with my problem.  
Don't you have any idea how to solve it, please?

# Answer

WebGL requires **CORS** (cross origin resource sharing) permissions for images because your image is not from the same origin. In other words the image is not from `jsfiddle.net` it's from `s29.postimg.org`

Whether or not you can solve it is up to the server of the image. In this case `s29.postimg.org`. It has to give permission to use the image.

You also have to request those permissions.

Add 

    image.crossOrigin = "";  // added
    image.src = ...

If it still doesn't work then `postimg.org` doesn't give permission.

Let's try it here

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    [
      "https://s29.postimg.org/ct644q1dz/sp_dom1.jpg",
      "https://i.imgur.com/lsQoyEIm.png",
      "https://c2.staticflickr.com/2/1638/26142586042_8815f263b7.jpg",
    ].forEach(loadImage);
      
    function loadImage(url) {
      var image = document.createElement("img");
      var hostname = (new URL(url)).hostname;
      image.crossOrigin = "";
      image.src = url;
      image.onload = function(e) {
        log("**CAN** use image " + e.target.src + 
            ". Permission given by " + hostname);
      }; 
      image.onerror = function(e) {
        log("can **NOT** use image '" + e.target.src + 
            "'. Permission not given by " + hostname);
      }
    }

    function log(msg) {
      var elem = document.createElement("p");
      elem.appendChild(document.createTextNode(msg));
      document.body.appendChild(elem);
    }

<!-- end snippet -->

From the above test it appears `postimg.org` does not give permission but both `imgur.com` and `flickr.com` do.

See https://hacks.mozilla.org/2011/11/using-cors-to-load-webgl-textures-from-cross-domain-images/

