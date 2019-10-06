Title: How can I bypass or set up CORS for Unity3D?
Description:
TOC: qna

# Question:

I'm trying to get a WebGL game that calls a server running with Unity3D, however, I've hit this:

 XMLHttpRequest cannot load http://api.playerio.com/api/13. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://www.teonnyn.com' is therefore not allowed access.

Has anyone encountered this before? I did some research, and it seems to be trying to use CORS.. but I have no control over the server code directly beyond my own bit, and setting .htaccess does not seem to work.

# Answer

Without access to the server **serving the image** there's not much you can do.

You need the server to support CORS *and* you need to request images using CORS, meaning just requesting the image from a server that supports CORS is not enough. You also have to tell browser you want it to check for CORS permission. [From MDN](https://hacks.mozilla.org/2011/11/using-cors-to-load-webgl-textures-from-cross-domain-images/)

> In order to load it with CORS as a WebGL texture, we set the crossOrigin attribute on it:

>      var earthImage = new Image();
>      earthImage.crossOrigin = "anonymous";

> Now we load it as usual:

>     earthImage.onload = function() {
>        // whatever you usually to do load WebGL textures
>     };
>     earthImage.src = "http://khm0.googleapis.com/kh?v=95&x=0&y=0&z=0";

The reason you need to specifically request CORS is that CORS permission requires extra negotiation between the browser and the server. Since it's slower it's not the default.

As for the image server supporting CORS, if you don't have access to that server the only other way around it would be to use another server and have that server get the image and then send it to you with CORS. 

Otherwise you'll need to put all of your images on the same server as your webpage.

