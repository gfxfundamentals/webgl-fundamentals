Title: Unity plugin Texture is immutable
Description:
TOC: qna

# Question:

I have kind of a complicated question. In unity WebGL, loading textures (using LoadImage) causes the engine to freeze for several milliseconds causing stuttering in the game, even worse when loading a large texture. This is a known problem.

To avoid the freeze, I decide to try to let the browser load the texture, and apply that texture to a gameObject. This way there should be no freeze because the browser does it on a thread.

To do this is a little bit complicated, so i based this solution on WebGLMovieTexture, which is a free asset in the asset store that allows you to play movies using the browsers built in player (instead of the unitys VideoPlayer), applying it to a texture and then a gameObject. I use this often and it works, so i decide to try the same thing with images.

To do this have to create a plugin in Javascript, an interface class to that plugin in c#, then create a class that uses that interface class.

First here is the Javascript plugin, i included only the important bits here
    
    var LibraryWebGLImageTexture = {

    $imageInstances: [],

    WebGLImageTextureCreate: function(url)
    {
      var str = Pointer_stringify(url);
      var img = document.createElement('img');
      img.onload=function() {
       console.log("image load completed"); <<<-------------
      }
      img.style.display = 'none';
      img.src = str;
      return imageInstances.push(img) - 1;
    },

    WebGLImageTextureRefresh: function(img, tex)
    {
      GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[tex]);
      GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, true);
      GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA,GLctx.UNSIGNED_BYTE, imageInstances[img]);
      GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, false);
    }

Here is the C# interface class to the plugin, again only included the important parts

    public class WebGLImageTexture 
    {
 [DllImport("__Internal")]
 private static extern int WebGLImageTextureCreate (string url);

 [DllImport("__Internal")]
 private static extern void WebGLImageTextureRefresh (int img, int texture);

    public Texture2D m_Texture=null;
 int m_Instance; 
 bool m_Loop;

 public WebGLImageTexture (string url)
 {
        Debug.Log("creating image element");
  m_Instance = WebGLImageTextureCreate(url);
        imgInfo();
        Debug.Log("image element created:"+m_Instance);
 }

    public void imgInfo()
    {
        Debug.Log("trying to get width and height...=" + m_Instance);
        var width = 672;
        var height = 420;
        m_Texture = new Texture2D(width, height, TextureFormat.ARGB32, false);
        m_Texture.wrapMode = TextureWrapMode.Clamp;
        Debug.Log("IMAGE:"+m_Texture);
    }
 public void Refresh()
 {
        Debug.Log("Image Update IN");
  WebGLImageTextureRefresh(m_Instance, m_Texture.GetNativeTextureID());
    }

 static public implicit operator Texture2D(WebGLImageTexture tex)
    {
        Debug.Log("IMPLICIT TEXTURE 2D");
        return tex.m_Texture;
    } 

The class below is using the above interface to the plugin to create an instance of the plugin, passing the URL to the image. Then it waits a short time for the image to load, then calls the plugins refresh function to transfer the texture to the gameObject.

    WebGLImageTexture it;   // plugin interface

 void Start () {
        it = new WebGLImageTexture("http://interfacelift.com/wallpaper/previews/04194_pagview_672x420.jpg");
        gameObject.GetComponent<Renderer>().material.mainTexture = it;
        Invoke("loaded", 20); // wait for image to load then invoke this
    } 


    public void loaded()
    {
        it.Refresh();
    }

    //Spin the cube

    void Update () {
        transform.Rotate(new Vector3(1, 2, 3) * Time.deltaTime * 10);
    }

As you can see from the javascript plugin code at the very top, when the image loads it prints to the console "image load completed". This works!

A short while later the invoke times out and calls the plugins refresh function, which does something to place the image into the texture, but in the refresh function it crashes with an error

    [.WebGL-0000005F0C18E320] GL_INVALID_OPERATION: Texture is immutable.

The plugins refresh function seems to be using OpenGL, which i dont know, and its giving this error in the refresh function which is key to making this work.

Does anybody know how to solve this error?


# Answer

The only reason I can think to get that error is the texture was allocated with `gl.texStorage2D` which means you can only use `gl.texSubImage2D` to update the texture. 

`gl.texStorage2D` allocates a texture and all of it's mip level in one call. From that point on the size of the texture can not be changed. `gl.texImage2D` reallocates individual mip levels where so you can't use that to update a texture allocated with `gl.texStorage2D` but you can update the contents of existing texture with `gl.texSubImage2D`

In other words change this line

```
GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA,GLctx.UNSIGNED_BYTE, imageInstances[img]);
```

to this

```
GLctx.texSubImage2D(GLctx.TEXTURE_2D, 0, 0, 0, GLctx.RGBA, GLctx.UNSIGNED_BYTE, imageInstances[img]);
```

FYI though your code is going to have issues by not waiting for the texture to actually load. Just waiting for "awhile" won't be enough if the user is on a slow connection. You'll need to refactor so you can either get an event from JavaScript in C# when the image has loaded or else poll from the game once in a while

Just guessing something like

```
var LibraryWebGLImageTexture = {

$imageInstances: [],

WebGLImageTextureCreate: function(url)
{
  var str = Pointer_stringify(url);
  var img = new Image();
  img.src = str;
  return imageInstances.push(img) - 1;
},

WebGLImageTextureLoaded: function(img)
{
  return imageInstances[img].complete;
},

WebGLImageTextureWidth: function(img)
{
  return imageInstances[img].width;
},

WebGLImageTextureHeight: function(img)
{
  return imageInstances[img].height;
},

WebGLImageTextureRefresh: function(img, tex)
{
  GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[tex]);
  GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, true);
  GLctx.texSubImage2D(GLctx.TEXTURE_2D, 0, 0, 0, GLctx.RGBA, GLctx.UNSIGNED_BYTE, imageInstances[img]);
  GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, false);
}
```

```
public class WebGLImageTexture 
{
[DllImport("__Internal")]
private static extern int WebGLImageTextureCreate (string url);

[DllImport("__Internal")]
private static extern bool WebGLImageTextureLoaded (int img);

[DllImport("__Internal")]
private static extern int WebGLImageTextureWidth (int img);

[DllImport("__Internal")]
private static extern int WebGLImageTextureHeight (int img);

[DllImport("__Internal")]
private static extern void WebGLImageTextureRefresh (int img, int texture);

...
```

I'll let you figure out if you want to check in update if the image has loaded or use a coroutine to check if the image has loaded or not

If you wanted to also check for error then maybe something like

```
var LibraryWebGLImageTexture = {

$imageInstances: [],

WebGLImageTextureCreate: function(url)
{
  var str = Pointer_stringify(url);
  var img = new Image();
  var info = {img: img, error: false}
  img.onerror = function() {
    info.error = true;
  };
  img.src = str;
  return imageInstances.push(info) - 1;
},

WebGLImageTextureLoaded: function(img)
{
  return imageInstances[img].img.complete;
},

WebGLImageTextureError: function(img)
{
  return imageInstances[img].error;
},


WebGLImageTextureWidth: function(img)
{
  return imageInstances[img].img.width;
},

WebGLImageTextureHeight: function(img)
{
  return imageInstances[img].img.height;
},

WebGLImageTextureRefresh: function(img, tex)
{
  GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[tex]);
  GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, true);
  GLctx.texSubImage2D(GLctx.TEXTURE_2D, 0, 0, 0, GLctx.RGBA, GLctx.UNSIGNED_BYTE, imageInstances[img].img);
  GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, false);
}
```

```
public class WebGLImageTexture 
{
[DllImport("__Internal")]
private static extern int WebGLImageTextureCreate (string url);

[DllImport("__Internal")]
private static extern bool WebGLImageTextureLoaded (int img);

[DllImport("__Internal")]
private static extern bool WebGLImageTextureError (int img);

[DllImport("__Internal")]
private static extern int WebGLImageTextureWidth (int img);

[DllImport("__Internal")]
private static extern int WebGLImageTextureHeight (int img);

[DllImport("__Internal")]
private static extern void WebGLImageTextureRefresh (int img, int texture);

...
```

Now you can check in your polling if `WebGLImageTextureError` returns true then you got an error and if `WebGLImageTextureLoaded` returns true the image is done loading.
