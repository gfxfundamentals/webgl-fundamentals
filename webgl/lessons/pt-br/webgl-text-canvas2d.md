Title: Texto WebGL - Telas 2D
Description: Como exibir texto usando uma tela 2D que está em sincronia com o WebGL
TOC: Texto WebGL - Telas 2D


Este artigo é uma continuação de [artigos anteriores do WebGL sobre desenho de texto](webgl-text-html.html). Se você não os leu, sugiro que você comece lá e trabalhe de volta.

Em vez de usar elementos HTML para texto, também podemos usar outra tela, mas com um contexto 2D. Sem perfis é apenas um palpite de que isso seria mais rápido do que usar o DOM. Claro que também é menos flexível. Você não possui todo o estilo sofisticado do CSS. Mas, não há elementos HTML para criar e acompanhar.

Semelhante aos outros exemplos, fazemos um recipiente, mas desta vez colocamos 2 telas nele.

    <div class="container">
      <canvas id="canvas"></canvas>
      <canvas id="text"></canvas>
    </div>

Em seguida, configure o CSS para que a tela e o HTML se sobrepnham

    .container {
        position: relative;
    }

    #text {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10;
    }

Agora procure a tela de texto no tempo de inicialização e crie um contexto 2D para isso.

    // look up the text canvas.
    var textCanvas = document.querySelector("#text");

    // make a 2D context for it
    var ctx = textCanvas.getContext("2d");

Ao desenhar, assim como o WebGL, precisamos limpar a tela 2D em cada quadro.

    function drawScene() {
        ...

        // Clear the 2D canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

E então chamamos `fillText` para desenhar texto

        ctx.fillText(someMsg, pixelX, pixelY);

E aqui está o exemplo:

{{{example url="../webgl-text-html-canvas2d.html" }}}

Por que o texto é menor? Porque esse é o tamanho padrão para o Canvas 2D.
Se você quiser outros tamanhos [confira a API Canvas 2D] https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text).

Outra razão para usar o Canvas 2D é fácil desenhar outras coisas. Por exemplo, vamos adicionar uma seta

    // draw an arrow and text.

    // save all the canvas settings
    ctx.save();

    // translate the canvas origin so 0, 0 is at
    // the top front right corner of our F
    ctx.translate(pixelX, pixelY);

    // draw an arrow
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.stroke();

    // draw the text.
    ctx.fillText(someMessage, 20, 20);

    // restore the canvas to its old settings.
    ctx.restore();

Antes de tirar proveito da tela Canvas 2D [matriz de pilha](webgl-2d-matrix-stack.html) traduzir a função, então não precisamos fazer nenhuma matemática extra ao desenhar nossa seta. Nós apenas pretendemos desenhar na origem e traduz-se cuida de mover essa origem para o canto da nossa F.

{{{example url="../webgl-text-html-canvas2d-arrows.html"}}}

Eu acho que cobre o uso do Canvas 2D. [Confira a API Canvas 2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) para obter mais ideias. [Em seguida, iremos renderizar texto no WebGL](webgl-text-texture.html).
