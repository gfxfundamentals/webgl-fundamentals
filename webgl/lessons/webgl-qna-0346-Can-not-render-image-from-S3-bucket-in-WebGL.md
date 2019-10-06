Title: Can not render image from S3 bucket in WebGL
Description:
TOC: qna

# Question:

When my JavaScript app trys to load an image from my Amazon S3 account and render it in WebGL the browser throws a CORS error. I changed the S3 bucket's CORS configuration to allow access:

    <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
        <CORSRule>
            <AllowedOrigin>*</AllowedOrigin>
            <AllowedMethod>GET</AllowedMethod>
            <MaxAgeSeconds>3000</MaxAgeSeconds>
            <AllowedHeader>Authorization</AllowedHeader>
        </CORSRule>
    </CORSConfiguration>

Unfortunately, browsers still throw the CORS error when I try to render an image from the S3 bucket.

Is there a step I missed? Or, is this just normal? In other words, does WebGL always reject cross-domain files regardless of whether the file's domain allows access via the appropriate CORS configuration?

# Answer

[According to MDN](https://hacks.mozilla.org/2011/11/using-cors-to-load-webgl-textures-from-cross-domain-images/)

> In order to load it with CORS as a WebGL texture, we set the crossOrigin attribute on it:

    var earthImage = new Image();
    earthImage.crossOrigin = "anonymous";

> Now we load it as usual:

    earthImage.onload = function() {
      // whatever you usually to do load WebGL textures
    };
    earthImage.src = "http://khm0.googleapis.com/kh?v=95&x=0&y=0&z=0";
