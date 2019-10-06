Title: Webgl, Safari and Chrome Compatibility
Description:
TOC: qna

# Question:

I am making my first steps coding. And since a time ago I started experimenting with Three.js.

I changed the settings of Chrome and Safari to use local files, but some months later my safari and chrome are dead, and it stops showing the local files even if I change the settings to allow local files.

It seems that it brokes if I use it a lot. Why it happens? Is there a solution to avoid this problem?

I tryed to look for this problem in Google but I can't find anything. I am using the last versions of safari, chrome and three.js and even like this Safari and Chrome still broken.

Is not a problem of my graphic card because I can see all kind of experiments in the web. Is a problem of my local files.

For example I can see this perfectly on my browsers: http://threejs.org/examples/#webgl_geometry_text

But if I download three.js and I open it from my desktop my browsers doesn't display it.

# Answer

Use a webserver. It's super simple and easy. The easiest is python which is built into OSX (you mentioned safari so I'm assuming you're on OSX)

Open a terminal, cd to the folder your files are in, type 

    python -m SimpleHTTPServer

Now go to `http://localhost:8000`

The only issue with python's simple webserver is it's really slow. For 2 faster alternatives there's [`devd`](https://github.com/cortesi/devd) which once you've downloaded it you just type

    cd path/to/your/files
    path/to/devd .

devd even includes a live-reload feature so when you edit your files the browser auto-reload

Another alternative is node.js. [Install it](http://nodejs.org) then in a terminal type

    sudo npm install -g http-server

from that point on you can go to any folder and type

    http-server

then in the browser go to `http://localhost:8080`.

Both `devd` and `node.js` are fast

Going the node.js route you can then learn about things like `webpack` and `npm` and/or `bower` which make it super easy to include libraries and use advanced features and advance your skills
