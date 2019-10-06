Title: Limit on webgl objects in different browsers
Description:
TOC: qna

# Question:

When opening an html file with 16 webgl objects in Chrome I get a warning that there are too many webgl objects. However with 15 objects this works fine. I haven't got this problem with Edge even with 20 objects. I was wondering what are the limits on the number of webgl objects for different browsers?

# Answer

It's not defined and even if you knew the limit today for a particular browser there's no guarantee it wouldn't change tomorrow.

The better question is what are you trying to do?

If you need lots of WebGL on the same page there are several solutions. The most performant is probably this one

Using raw-ish WebGL

https://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page/30546250#30546250

Using three.js

https://stackoverflow.com/questions/30608723/is-it-possible-to-enable-unbounded-number-of-renderers-in-three-js/30633132#30633132


