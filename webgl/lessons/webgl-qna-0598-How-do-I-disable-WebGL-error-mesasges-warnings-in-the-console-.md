Title: How do I disable WebGL error mesasges/warnings in the console?
Description:
TOC: qna

# Question:

This is what my debug console looks like in chome:

[![Lots of webgl warnings][1]][1]

Thing is, I'm using a WebGL framework do draw everything and I don't have the means to debug it. My app works well despite some vertices being out of range / off-screen. Can I just silence the warnings so that people who visit my website don't see them (and so that I can debug the site without this spam)?

**EDIT**

I know it's always better to fix the bug than shut up the message. However in this case I've confirmed that the problem was likely with my graphics card (specifically, the problem was fixed after I stopped a bitcoin miner that was running on my computer). Before downvoting, consider that a google search on this topic doesn't currently have very many useful results. Thanks.

  [1]: http://i.stack.imgur.com/Veywm.png

# Answer

There is no way to turn off the error messages. You have to just stop doing whatever it is that's generating the error

That bug means something isn't getting drawn. Since you clearly don't care if it's getting drawn or not then stop trying to draw whatever it is that causing the error message.

To find out what that is *bisect*. Remove half the things you're drawing. If you don't get the error any more then the issue is one of the half of the things you removed. If you still get the error remove the other half. Do you still get it? if that removes the error you know the issue is in the second half of stuff you removed.

Now remove the half of the half and so on. Keep doing that until you find the object(s) that are causing the error. Since they weren't being drawn anyway just remove them from your code. 


