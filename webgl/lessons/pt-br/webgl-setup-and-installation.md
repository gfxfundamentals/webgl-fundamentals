Title: WebGL - Configuração e instalação
Description: Como desenvolver em WebGL
TOC: WebGL - Setup e instalação


Techincamente você não precisa de nada além de um navegador web para desenvolver em WebGL.
Acesse [jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/) ou [jsbin.com](https://jsbin.com) ou [codepen.io](https://codepen.io/greggman/pen/YGQjVV) e apenas comece a aplicar as lições aqui.

Em todos eles, você pode fazer referência a scripts externos, adicionando um

`<script src =" ... "> </ script>`

par de tags se você quiser usar scripts externos.

Ainda assim, existem limites. O WebGL tem restrições mais fortes do que o Canvas2D para carregar imagens, o que significa que você não pode acessar facilmente imagens da Web para o seu trabalho WebGL.

Além disso, é mais rápido trabalhar com tudo local.

Vamos supor que você deseja executar e editar as amostras neste site. A primeira coisa que você deve fazer é baixar o site. [Você pode baixá-lo aqui](https://github.com/gfxfundamentals/webgl-fundamentals/).

{{{image url="resources/download-webglfundamentals.gif" }}}

Descompacte os arquivos para o mesmo diretório.

## Usando um pequeno e simples servidor Web simples

Em seguida, você deve instalar um pequeno servidor web. Eu sei que o "servidor web" parece assustador, mas a verdade é [web
Os servidores são realmente extremamente simples](https://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

Se você estiver no Chrome, aqui está uma solução simples.
[Aqui está uma pequena extensão cromada que é um servidor web](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=pt-br)

{{{image url = "resources/chrome-webserver.png"}}}

Basta apontá-lo para a pasta onde você descompactou os arquivos e clique em um dos URLs do servidor web.

Se você não estiver no Chrome ou se não quiser usar a extensão, outra maneira é usar [node.js](https://nodejs.org).
Faça o download, instale-o e abra um prompt de comando / console / janela de terminal. Se você estiver no Windows, o instalador
irá adicionar um "Node Command Prompt" especial, então use isso.

Em seguida, instale o [`servez`](https://github.com/greggman/servez-cli) digitando

    npm -g install servez

Se você estiver no uso OSX

    sudo npm -g install servez

Depois de ter feito esse tipo

    caminho do servez/para/pasta/onde/você/descompactou/arquivos

Deve imprimir algo como

{{{image url = "resources/servez-response.png"}}}

Então, no seu navegador, acesse [`http://localhost:8080`](http://localhost:8080).

Se você não especificar um caminho, então servez será o servidor da pasta atual. Baixe-o aqui](https://github.com/gfxfundamentals/webgl-fundamentals/).

## Usando as Ferramentas de Desenvolvimento dos Navegadores

A maioria dos navegadores possui ferramentas extensas para desenvolvedores incorporadas.

{{{image url = "resources/chrome-devtools.png"}}}

[Docs para Chrome estão aqui](https://developers.google.com/web/tools/chrome-devtools/),
[Docs para Firefox estão aqui](https://developer.mozilla.org/en-US/docs/Tools).

Saiba como usá-los. Se nada mais verificar sempre o console de JavaScript. Se houver um problema, muitas vezes ele terá uma mensagem de erro. Leia a mensagem de erro de perto e você deve obter uma pista onde o problema é.

{{{image url = "resources/javascript-console.gif"}}}

## Assistentes de WebGL

Existem vários inspetores/assitentes de WebGL. [Aqui está um para o Chrome](https://benvanik.github.io/WebGL-Inspector/).

{{{image url = "https://benvanik.github.io/WebGL-Inspector/images/screenshots/1-Trace.gif"}}}

[O Firefox também tem um semelhante](https://hacks.mozilla.org/2014/03/introducing-the-canvas-debugger-in-firefox-developer-tools/).
Ele precisa ser ativado em `about: flags` e pode exigir o [Modo de desenvolvedor do Firefox](https://www.mozilla.org/en-US/firefox/developer/).

Eles podem ou não ser úteis. A maioria deles é projetada para amostras animadas e irá capturar um quadro e permitir que você veja todas as chamadas do WebGL que fizeram essa moldura. Isso é ótimo se você já tiver algo a funcionar ou se você tivesse algo funcionando e quebrou. Mas não é tão bom se o seu problema é durante a inicialização que eles não capturam ou se você não está usando a animação, como no desenho de cada quadro. Ainda assim, eles podem ser muito úteis. Muitas vezes, vou clicar em uma chamada de sorteio e verificar os uniformes. Se eu vejo um
monte de `NaN` (NaN = não é um número), então eu geralmente posso rastrear o código que definiu esse uniforme e encontrar o bug.

## Inspecione o Código

Também lembre-se sempre de que você pode inspecionar o código. Você geralmente pode simplesmente escolher a fonte de visualização

{{{image url = "resources/view-source.gif"}}}

Mesmo se você não pode clicar com o botão direito em uma página ou se a fonte estiver em um arquivo separado, você sempre pode ver a fonte nos devtools

{{{image url = "resources/devtools-source.gif"}}}

## Inicie

Espero que isso o ajude a começar. [Agora de volte às aulas](index.html).
