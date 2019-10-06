Title: WEBGL_shared_resources Extension in chrome
Description:
TOC: qna

# Question:

Im trying to use `WEBGL_shared_resources` Extension in chrome 58.  
I checked if it supported with this code and I get error so its not.  

    <canvas id="myCanvas1" width = "1250" height = "600"></canvas>

        var Canvas1 = document.getElementById('myCanvas1');
        ctx1 = Canvas1.getContext("webgl");
        if(ctx1.getExtension("WEBGL_shared_resources") == null)
           throw "Shared resources are not supported";


My question is how do I add this extension?  
Is that depend on browser version? OS? gpu?  


# Answer

[`WEBGL_shared_resources` extension](https://www.khronos.org/registry/webgl/extensions/WEBGL_shared_resources/) is just a draft and has never been implemented in any browser.

If you're looking for a way make it appear as though you have multiple canvases sharing resources see this q&a:

https://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page
