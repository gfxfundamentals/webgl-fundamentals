Title: Unity WebGL for Chrome [Browser-Fix-Needed]
Description:
TOC: qna

# Question:

I created a project in unity and exported it as WebGL, but when I open it in Chrome, I get this message (Please see image attached). If there is a fix, I need it to not have to be manually applied to the browser (if possible).

![This is the error that pops up in the chrome browser][1]


  [1]: https://i.stack.imgur.com/1KYdJ.png

# Answer

You need to run a local server

Here's a easy one

https://greggman.github.io/servez/

Here's a bunch more

https://stackoverflow.com/questions/12905426/what-is-a-faster-alternative-to-pythons-http-server-or-simplehttpserver

They will take you 30 seconds to get going.

Basically if you load a webpage from a local file directly (file://some/path/to/file) chrome blocks that page from accessing other files because it's a security risk. If a local file could access other files on your computer it could upload those files to some other website so chrome blocks it.

