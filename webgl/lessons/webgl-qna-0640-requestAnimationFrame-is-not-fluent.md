Title: requestAnimationFrame is not fluent
Description:
TOC: qna

# Question:

I'm writing some WebGL animation and I can't make requestAnimationFrame work fluently. I wrote this empty cycle to test it in different browsers:

    <html>
        <body>
            <script type="text/javascript">

                var prev = Date.now();

                function frame()
                {
                    window.requestAnimationFrame(frame);

                    var now = Date.now();
                    var diff = now - prev;
                    prev = now;

                    if(diff > 20)
                    {
                        console.log(new Date().toLocaleTimeString() + ": " + diff);
                    }
                }

                frame();

            </script>
        </body>
    </html>

It calculates time passed between frames and logs to console if it was longer than 20 ms. My setup is: Windows 7 x64, Intel i7, Sapphire Tri-X R9 290, 16 GB RAM. Display frequency is 60 Hz, so I expect to see 1 / 60 = 16.666(6) ms gap between frames. So I've set 20 ms threshold to prevent console flooding. Nothing is happening in background, everything is idle. No other browser tabs are open. And here are my numbers:

    Google Chrome:

    7:47:13 AM: 53
    7:47:16 AM: 53
    7:47:19 AM: 53
    7:47:22 AM: 53
    7:47:25 AM: 54
    7:47:28 AM: 53
    7:47:31 AM: 53
    7:47:34 AM: 53
    7:47:37 AM: 54
    7:47:40 AM: 54
    7:47:43 AM: 54
    7:47:46 AM: 54
    7:47:49 AM: 55
    7:47:52 AM: 54
    7:47:55 AM: 54
You can see the pattern clearly: every 3 seconds 53-55 ms gap. OK, try another browser:

    FireFox:

    7:49:25: 53
    7:49:25: 89
    7:49:26: 88
    7:49:28: 51
    7:49:28: 42
    7:49:28: 105
    7:49:28: 52
    7:49:28: 21
    7:49:28: 29
    7:49:34: 23
    7:49:34: 22
    7:49:38: 27
    7:49:39: 55
    7:49:39: 51
    7:49:39: 108
    7:49:45: 35
    7:49:45: 43
    7:49:45: 24
    7:49:45: 103
    7:50:09: 45
    7:50:18: 22
    7:50:19: 31
    7:50:25: 59
    7:50:25: 33
    7:50:25: 21

Even worse! Okay, let's continue. Opera has the same engine inside as Chrome does, but surprisingly it shown almost perfect timings, so I reduced threshold to greater than 17 ms:

    Opera:

    7:56:57 AM: 18
    7:57:00 AM: 18
    7:57:12 AM: 18
    7:57:13 AM: 18
    7:57:17 AM: 18
    7:57:19 AM: 18
    7:57:32 AM: 18
    7:57:33 AM: 18
    7:57:34 AM: 18
    7:57:37 AM: 18
    7:57:48 AM: 18
    7:57:50 AM: 18
    7:57:51 AM: 18
    7:57:54 AM: 18
    7:57:55 AM: 18

Interesting part that it works almost perfect until you don't touch keyboard and mouse. If you move mouse cursor then it can write this 18 ms message. And the biggest surprise - IE11. After a couple of 18 ms messages right after page refresh it worked absolutely fluent for many minutes with less than 1 ms precision. Well done, IE11.

    IE11:

 ‎   7‎:‎59‎:‎25: 18

 ‎   7‎:‎59‎:‎25: 18

So, what's going on? Why these behaviors are so different? How can I make fluent WebGL animation in all browsers?

**UPDATE**
I've changed logging condition to: if(diff > 17 || diff < 16) and I've seen that Google Chrome and FireFox sometimes has just a few ms gaps, like 1-2-3 ms. So looks like they're trying to keep animation VSynced, but they aren't doing it very well. So my question remains opened.


# Answer

I'm not seeing it quite as bad as you on my MBP in Chrome or Firefox. In fact I see no problems after the first 1-3 frames.

Below is your sample inline. I changed it a little to use the time passed to `requestAnimationFrame` instead of `Date.now` as the one passed to `requestAnimationFrame` is suppose to be more accurate.

I will note that I've got 23 tabs open and many of them, including Stack Overflow itself do stuff in the background like send websockets for notifications etc..

PS: I think you mean "fluidly" instead of "fluently"? 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var prev = 0;
    var frameCount = 0;

    function frame(now)
    {
      ++frameCount;
      var diff = now - prev;
      prev = now;

      if(diff > 20)
      {
        console.log(frameCount, new Date().toLocaleTimeString(), ": ", diff);
      }

      // It's easier to debug things with this at the bottom
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);


<!-- end snippet -->


