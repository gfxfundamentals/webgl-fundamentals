Title: SecurityError for same-origin image texImage2D
Description:
TOC: qna

# Question:

I am currently learning WebGL.  In a call to texImage2D, which is called when a texture has finished loading, I get the following `SecurityError`:

    Uncaught SecurityError: Failed to execute 'texImage2D' on 'WebGLRenderingContext': The cross-origin image at /path/to/texure.png may not be loaded.

However, the file is on the same domain, in fact it is in the same directory as the html file requesting it.

Here is the file layout:

    > js
    |-> script.js
    |-> glUtils.js
    |-> sylvester.js
    > texture.png
    > index.html

And when I look in the F12 console's resource list, the image `texture.png` is there, fully loaded, and it is 256 x 256.  Why does it think I am requesting from another domain?

# Answer

You're probably getting the error because you're using a `file://` based URL.

The solution is to use a simple web server. Open a terminal and type

    python -m SimpleHTTPServer

then go to `http://localhost:8000` (install python if you're on Windows) or use [node.js](https://stackoverflow.com/questions/12905426/what-is-a-faster-alternative-to-pythons-simplehttpserver/12905427#12905427) or possibly even better use [devd](https://github.com/cortesi/devd)

Do NOT use `--allow-file-access-from-files`. This opens your machine to getting hacked through the browser. That would be like turning off your firewall or your virus scanner.
