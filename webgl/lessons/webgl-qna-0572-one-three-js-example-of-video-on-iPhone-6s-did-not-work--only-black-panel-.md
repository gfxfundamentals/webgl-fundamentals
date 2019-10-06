Title: one three.js example of video on iPhone 6s did not work( only black panel)
Description:
TOC: qna

# Question:

one three.js example of video on iPhone 6s  did not work( only black panel)

https://stemkoski.github.io/Three.js/Video.html


But the example works fine on PC desktop browser.
It failed in Safari & Chronme on iPhone 6s


# Answer

As of 2019 the solution for iOS is

1. you have to start the video in user gesture event like 'click' or 'touchstart'

   Otherwise the browser will refuse to play the video

        someElement.addEventListener('click', () => {
         videoElement.play();
        });

2. you have to set `playsInline` to true

        videoElement.playsInline = true;

Here's a working example as of iOS 12

http://webglsamples.org/video/video.html








