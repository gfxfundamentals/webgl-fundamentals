Title: Load Audio from persistentDataPath in runtime (Unity3d WebGL)
Description:
TOC: qna

# Question:

I have online/offline project.
I need to download wav/ogg/mp3 file from Application.persistentDataPath on WebGL platform.

I tried www/webrequest.

For example - WWW("file://" + Application.persistentDataPath + filePath);

But always get error: Failed to load: Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, https.

Could you help me?

P.S. From remote server works fine.

# Answer

You can not load local files in a browser as it's a security risk. If you could then a webpage could read your hard drive and steal all your files. 

If you're just testing you can [run a local server](https://stackoverflow.com/questions/12905426/what-is-a-faster-alternative-to-pythons-http-server-or-simplehttpserver). 

If you want to let the user supply a file you can [let them choose a file](https://stackoverflow.com/questions/35183253/unity3d-upload-a-image-from-pc-memory-to-webgl-app)


