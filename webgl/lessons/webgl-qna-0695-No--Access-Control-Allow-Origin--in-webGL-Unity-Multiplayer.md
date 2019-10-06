Title: No 'Access-Control-Allow-Origin' in webGL Unity Multiplayer
Description:
TOC: qna

# Question:

I'm using ["Network Lobby"][1] asset for unity and trying to make webGL build with using WebSockets. When I create a game or get a list of servers I get the following error:

> XMLHttpRequest cannot load https://mm.unet.unity3d.com/json/reply/ListMatchRequest. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin '*my_domain_name*' is therefore not allowed access.

Is it a problem on the server or on the client? And how can I solve it?
  [1]: https://www.assetstore.unity3d.com/en/#!/content/41836

# Answer

The problem is with the server. The server has to give permission (by sending the correct headers) before the browser will let you read the data.

https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
