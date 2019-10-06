Title: Force Web GL Version from 2.0 to 1.0
Description:
TOC: qna

# Question:

I implemented last year a code to a plugin of Sign language in a web site, now i need to implement in a new website but the script has been updated and the new version is using WEB GL 2.0 before this update was using WEB GL 1.0, how can i force this script to work in all systems and try to return in oldest version (WEB GL 1.0)?

e.g. 1 - I need this plugin working again in every systems and computers, probably i need return to oldest version. I imagine it to be some question of video card incompatibility, DirectX version or Browser that prevents the correct operation of WebGL 2.0.
e.g. 2 - See below the two code versions Oldest and New:    

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <!-- Oldest Version -->
    <script type="text/javascript">
      var _hta = {'_setToken': '1cb6fd2fd91d70f82b0eb23452sdg5235','_htException': 'HandTalk_EXCECAO'};
      (function() {
        var ht = document.createElement('script'); ht.type = 'text/javascript'; ht.async = true;
        ht.src = '//api.handtalk.me/handtalk_init.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.appendChild(ht);
      })();
      (function(proxied) {
      window.alert = function() {
        return proxied.apply(this, arguments);
      };
      })(window.alert);
    </script>

    <!-- New Version -->
    <script src="//api.handtalk.me/plugin/latest/handtalk.min.js"></script>
    <script>
      var ht = new HT({
        token: "1cb6fd2fd91d70f82b0eb23452sdg5235"
      });
    </script>

<!-- end snippet -->



# Answer

WebGL doesn't automatically use version 2. To use version 1 you request "webgl". 

    const gl = someCanvas.getContext("webgl");

To use version 2 you request version "webgl2"

    const gl = someCanvas.getContext("webgl2");

If you have some 3rd party library that happens to be doing the requesting and is using WebGL2, well first off it's JavaScript so you can probably just edit the library so it doesn't ask for WebGL2. Otherwise if you want it to force it to use WebGL1 you could wrap `getContext` something like this so it fails if "webgl2" is requested

    <!-- must appear before including the 3rd party script -->
    <script>
    HTMLCanvasElement.prototype.getContext = (function(oldFn) {
      return function(type) {
        if (type  === "webgl2") {
          return null;
        }
        return oldFn.apply(this, arguments);
      };
    }(HTMLCanvasElement.prototype.getContext));
    </script>
    <script src="some3rdPartyScriptThatUsesWebGL2ButCanFallbackToWebGL1.js"></script>


