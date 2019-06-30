Title: WebGL e Alpha
Description: Como o alpha no WebGL é diferente do alpha no OpenGL
TOC: WebGL e canal Alpha


Eu notei que alguns desenvolvedores do OpenGL têm problemas com a forma como o WebGL
trata alfa no backbuffer (ou seja, a tela), então pensei que poderia ser bom analisar
algumas das diferenças entre o WebGL e OpenGL relacionado ao alfa.

A maior diferença entre o OpenGL eo WebGL é que o OpenGL torna um backbuffer que não está composto com nada,
ou efetivamente não está composta de nada pela janela do sistema operacional
gerente, então não importa o que é o seu alfa.

O WebGL é composto pelo navegador com a página web e o
o padrão é usar o alpha pré-multiplicado o mesmo que .png `<img>`
tags com transparência e tags de tela 2D.

O WebGL tem várias maneiras de tornar isso mais parecido com o OpenGL.

### #1) Diga ao WebGL que você deseja que ele seja composto com alfa não premultiplicado

    gl = canvas.getContext("webgl", {
      premultipliedAlpha: false  // Ask for non-premultiplied alpha
    });

O padrão é verdadeiro.

Claro que o resultado ainda será composto na página com o que for
A cor do fundo acaba sendo debaixo da tela (o fundo da tela
cor, a cor do fundo do recipiente da tela, o plano de fundo da página
cor, o material por trás da tela se a tela tiver um índice z> 0, etc ....)
em outras palavras, a cor CSS define para essa área da página.

Uma boa maneira de encontrar se você tiver algum problema alfa é configurar o
fundo da tela para uma cor brilhante como o vermelho. Você verá imediatamente
o que está acontecendo.

    <canvas style="background: red;"><canvas>

Você também pode configurá-lo em preto, o que irá ocultar quaisquer problemas alfa que você tenha.

### #2) Diga ao WebGL que você não quer alfa no backbuffer

    gl = canvas.getContext("webgl", { alpha: false }};

Isso fará com que ele atue mais como o OpenGL, já que o backbuffer só terá
RGB. Esta é provavelmente a melhor opção porque um bom navegador pode ver que
você não tem alfa e realmente otimiza a forma como o WebGL é composto. Claro
que isso também significa que na verdade não terá alfa no backbuffer, então, se você estiver
usando alpha no backbuffer para algum propósito que pode não funcionar para você.
Poucos aplicativos que eu conheço usam alpha no backbuffer. Eu penso que isso deveria ter sido o padrão.


### #3) Limpe o Alpha no final da sua renderização

    ..
    renderScene();
    ..
    // Set the backbuffer's alpha to 1.0
    gl.clearColor(1, 1, 1, 1);
    gl.colorMask(false, false, false, true);
    gl.clear(gl.COLOR_BUFFER_BIT);

A limpeza é geralmente muito rápida, pois há um caso especial para ela na maioria dos
hardware's. Eu fiz isso na maioria das minhas demonstrações. Se eu fosse inteligente, eu mudaria para
Método #2 acima. Talvez eu faça isso logo depois de publicar isso. Parece que
A maioria das bibliotecas WebGL deve ser padrão para este método. Esses poucos desenvolvedores
que realmente estão usando alfa para efeitos de composição podem pedir isso. o
O resto apenas obterá o melhor desempenho e as menos surpresas.

### #4) CLimpe o alfa uma vez, então não faça mais nada

    // At init time. Clear the back buffer.
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Turn off rendering to alpha
    gl.colorMask(true, true, true, false);

Claro que, se você estiver processando seus próprios quadros, você precisará
transformar a renderização para o alfa de volta e depois desligá-lo novamente
quando você alternar torender para a tela.

### #5) Lidando com Imagens

Meu padrão se você estiver carregando imagens com alfa no WebGL. O WebGL fornecerá
os valores como estão no arquivo PNG com valores de cor não premultiplicados.
Isso geralmente é o que eu estou acostumado com os programas OpenGL porque é sem
perdas, enquanto o pré-multiplicado é com perdas.

    1, 0.5, 0.5, 0  // RGBA

É um valor possível sem premultiplicado, enquanto pré-multiplicado é um valor
impossível porque `a = 0 'que significa' r`,` g` e `b` devem ser zero.

Você pode ter o WebGL pré-multiplicar o alfa se desejar. Você faz isso
configurando `UNPACK_PREMULTIPLY_ALPHA_WEBGL` para verdadeiro assim

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

O padrão não é premultiplicado.

Esteja ciente de que a maioria, se não todas as implementações do Canvas 2D,
funcionam com alfa pré-multiplicado. Isso significa que quando você os transfere
para o WebGL e `UNPACK_PREMULTIPLY_ALPHA_WEBGL` é falso, o WebGL irá convertê-lo
de novo para não premultipilado.

### #6) Usando uma equação de mistura que funciona com alfa pré-multiplicada.

Quase todas as aplicações OpenGL que escrevi ou trabalharam no uso

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

Isso funciona para texturas alfa não pré-multiplicadas.

Se você realmente quiser trabalhar com texturas alfa pré-multiplicadas, então você provavelmente quer

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

Esses são os métodos que conheço. Se você souber de mais, por favor, publique-os abaixo.
