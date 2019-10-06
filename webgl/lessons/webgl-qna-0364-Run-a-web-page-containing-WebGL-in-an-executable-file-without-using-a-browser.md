Title: Run a web page containing WebGL in an executable file without using a browser
Description:
TOC: qna

# Question:

I wonder if it is possible to run a WebGL website without preinstalled browsers. I thought the WebBrowser of Visual Studio might help, but I read that it uses the Engine of Internet Explorer in compatibility mode, therefore I cannot run WebGL with that. Any ideas?

# Answer

[Electron](https://github.com/atom/electron) might work. It's basically Chromium + IO.js
