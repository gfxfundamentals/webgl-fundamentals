Title: How can I prevent firefox outputting a console error?
Description:
TOC: qna

# Question:

Following code checks if the browser is available for webgl or not. 

    function is_webgl_available(){
        try {
            return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
        } catch(e) {
            return false;
        }
    }

In Firefox, I see the following error. It seems that my GPU is blacklisted for WebGL; which is not a problem. What I want is to keep console clean no matter how the function returns. 

    Error: WebGL: Disallowing antialiased backbuffers due to blacklisting.

How can I prevent Firefox to output this error?

# Answer

You probably can't. It looks like a bogus error and you should probably complain to Mozilla that it should be a warning at best.

Otherwise maybe you can turn off antialiasing

     return !!window.WebGLRenderingContext && 
            !!document.createElement('canvas').getContext(
                'experimental-webgl', 
                {antialias: false});
