Title: Three.js Screenshot custom size (using an offscreen rendere?)
Description:
TOC: qna

# Question:

Some background: I'm loading a three.js project (written by a colleague) in an iFrame on a responsive page. 

The goal: Be able to grab a screenshot of the three.js at a specific resolution (regardless of the viewport size)

I'm currently successful in grabbing a screenshot of the three.js project following advice found here: https://stackoverflow.com/questions/20801075/three-js-screenshot

The problem: The png produced is always the same size as the iFrame. 

Is it possible to duplicate the renderer in some sort of offscreen renderer that I can resize and take a snapshot of without impacting the end user? Or any advice on a different solution?

# Answer

One suggestion, do something like this?

    renderer.setSize( widthOfScreenshot, heightOfScreenshot );
    renderer.render( scene, camera );
    var screenshot = renderer.domElement.toDataURL();
    renderer.setSize( originalWidth, originalHeight );
    renderer.render( scene, camera );


