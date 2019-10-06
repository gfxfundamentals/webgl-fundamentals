Title: "Tainted canvases may not be loaded" Cross domain issue with WebGL textures
Description:
TOC: qna

# Question:

I've learnt a lot in the last 48 hours about cross domain policies, but apparently not enough.

Following on from [this][1] question. My HTML5 game supports Facebook login. I'm trying to download profile pictures of people's friends. In the HTML5 version of my game I get the following error in Chrome.

> detailMessage: "com.google.gwt.core.client.JavaScriptException:
> (SecurityError) ↵ stack: Error: Failed to execute 'texImage2D' on
> 'WebGLRenderingContext': Tainted canvases may not be loaded.

As I understand it, this error occurs because I'm trying to load an image from a different domain, but this can be worked around with an **Access-Control-Allow-Origin** header, as detailed in [this][2] question.

The URL I'm trying to download from is

https://graph.facebook.com/1387819034852828/picture?width=150&height=150

Looking at the network tab in Chrome I can see this has the required **access-control-allow-origin** header and responds with a 302 redirect to a new URL. That URL varies, I guess depending on load balancing, but here's an example URL.

https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xap1/v/t1.0-1/c0.0.160.160/p160x160/11046398_1413754142259317_606640341449680402_n.jpg?oh=6738b578bc134ff207679c832ecd5fe5&oe=562F72A4&__gda__=1445979187_2b0bf0ad3272047d64c7bfc2dbc09a29

This URL also has the **access-control-allow-origin** header. So I don't understand why this is failing.

Being Facebook, and the fact that thousands of apps, games and websites display users profile pictures, I'm assuming this is possible. I'm aware that I can bounce through my own server, but I'm not sure why I should have to.

#Answer#

I eventually got cross domain image loading working in libgdx with the following code (which is pretty hacky and I'm sure can be improved). I've not managed to get it working with the AssetDownloader yet. I'll hopefully work that out eventually.

    public void downloadPixmap(final String url, final DownloadPixmapResponse response) {
        final RootPanel root = RootPanel.get("embed-html");
        final Image img = new Image(url);
        img.getElement().setAttribute("crossOrigin", "anonymous");
        img.addLoadHandler(new LoadHandler() {

            @Override
            public void onLoad(LoadEvent event) {
                HtmlLauncher.application.getPreloader().images.put(url, ImageElement.as(img.getElement()));
                response.downloadComplete(new Pixmap(Gdx.files.internal(url)));
                root.remove(img);
            }
        });
        root.add(img);
    }

    interface DownloadPixmapResponse {
        void downloadComplete(Pixmap pixmap);

        void downloadFailed(Throwable e);
    }


  [1]: https://stackoverflow.com/questions/30926654/cant-get-access-control-allow-origin-header-to-work-as-i-expected
  [2]: https://stackoverflow.com/questions/9972049/cross-origin-data-in-html5-canvas

# Answer

are you setting the `crossOrigin` attribute on your img before requesting it?

    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://graph.facebook.com/1387819034852828/picture?width=150&height=150"; 

It's was working for me when this question was asked. Unfortunately the URL above no longer points to anything so I've changed it in the example below

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var img = new Image();
    img.crossOrigin = "anonymous";   // COMMENT OUT TO SEE IT FAIL
    img.onload = uploadTex;
    img.src = "https://i.imgur.com/ZKMnXce.png"; 

    function uploadTex() {
      var gl = document.createElement("canvas").getContext("webgl");
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        log("DONE: ", gl.getError());
      } catch (e) {
        log("FAILED to use image because of security:", e);
      }
    }

    function log() {
      var div = document.createElement("div");
      div.innerHTML = Array.prototype.join.call(arguments, " ");
      document.body.appendChild(div);
    }

<!-- language: lang-html -->

    <body></body>

<!-- end snippet -->

How to check you're receiving the headers

Open your devtools, pick the network tab, reload the page, select the image in question, look at both the REQUEST headers and the RESPONSE headers. 

[![enter image description here][1]][1]

The request should show your browser sent an `Origin:` header

The response should show you received 

    Access-Control-Allow-Methods: GET, OPTIONS, ...
    Access-Control-Allow-Origin: *

Note, both the response **AND THE REQUEST** must show the entries above. If the request is missing `Origin:` then you didn't set `img.crossOrigin` and the browser will not let you use the image even if the response said it was ok.

If your request has the `Origin:` header and the response does not have the other headers than that server did not give permission to use the image to display it. In other words it will work in an image tag and you can draw it to a canvas but you can't use it in WebGL and any 2d canvas you draw it into will become tainted and `toDataURL` and `getImageData` will stop working

  [1]: https://i.stack.imgur.com/58MRP.png
