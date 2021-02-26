Title: WebGL - Animação
Description: Como fazer animação no WebGL
TOC: WebGL - Animação


Esta publicação é uma continuação de uma série de postagens sobre o WebGL.
O primeiro <a href="webgl-fundamentals.html"> começou com os fundamentos </a>.
e o anterior foi sobre <a href="webgl-3d-camera.html"> câmeras 3D </a>.
Se você não leu isso, veja-os primeiro.

Como animamos algo no WebGL?

Na verdade, isso não é específico para o WebGL, mas, em geral, se você quer animar algo em JavaScript, precisa mudar algo ao longo do tempo e desenhar novamente.

Podemos tirar uma das nossas amostras anteriores e animá-la da seguinte forma.

    * var fieldOfViewRadians = degToRad (60);
    * var rotationSpeed ​​= 1,2;

    * requestAnimationFrame (drawScene);

    // Desenhe a cena.
    função drawScene () {
    * // Cada quadro aumenta um pouco a rotação.
    * rotação [1] + = rotaçãoSpeed ​​/ 60.0;

      ...
    * // Ligue drawScene novamente próximo quadro
    * requestAnimationFrame (drawScene);
    }

E aqui está

{{{example url="../webgl-animation-not-frame-rate-independent.html"}}}

Há um problema sutil. O código acima tem um `rotationSpeed ​​/ 60.0`. Nós dividimos por 60,0 porque assumimos o navegador
responderá a requestAnimationFrame 60 vezes por segundo, o que é bem comum.

No entanto, essa não é uma suposição válida. Talvez o usuário esteja em um dispositivo de baixa potência como um smartphone antigo. Ou talvez o usuário esteja executando algum programa pesado em segundo plano. Há todos os tipos de razões pelas quais o navegador pode não exibir quadros em 60 quadros por segundo. Talvez seja o ano de 2020 e todas as máquinas funcionam a 240 quadros por segundo agora. Talvez o usuário seja um jogador e tenha um monitor CRT com 90 quadros por segundo.

Você pode ver o problema neste exemplo

{{{diagram url="../webgl-animation-frame-rate-issues.html"}}}

No exemplo acima, queremos rodar todos os 'F's na mesma velocidade.
O 'F' no meio está em alta velocidade e é independente da taxa de quadros. O que está à esquerda e à direita simula se o navegador estiver funcionando apenas a uma velocidade máxima de 1/8 para a máquina atual. O do lado esquerdo é ** NOT ** taxa de quadros independente. O do direito ** IS ** taxa de quadros independente.

Observe porque o que está à esquerda não está levando em consideração que a taxa de quadros pode ser lenta, não se mantém. O que está na direita, no entanto, embora esteja funcionando a 1/8 da taxa de quadros, ele está mantendo o meio correndo a toda velocidade.

A maneira de tornar a taxa de quadros de animação independente é calcular o tempo que demorou entre os quadros e usar isso para calcular o quanto animar esse quadro.

Em primeiro lugar, precisamos ter o tempo. Felizmente, `requestAnimationFrame` nos passa o tempo desde que a página foi carregada quando nos chama.

Acho mais fácil se conseguimos o tempo em segundos, mas desde a
`requestAnimationFrame` nos passa o tempo em milissegundos (1000ths de segundo), precisamos multiplicar por 0.001 para obter segundos.

Então, podemos então calcular o tempo do delta como esse

*var then = 0;

    requestAnimationFrame(drawScene);

    // Draw the scene.
    *function drawScene(now) {
    *  // Convert the time to seconds
    *  now *= 0.001;
    *  // Subtract the previous time from the current time
    *  var deltaTime = now - then;
    *  // Remember the current time for the next frame.
    *  then = now;

       ...

Uma vez que temos o `deltaTime` em segundos, todos os nossos cálculos podem ser em quantas unidades por segundo queremos que algo aconteça. Nesse caso
`rotationSpeed` é 1.2, o que significa que queremos girar 1,2 radianos por segundo.
Isso é cerca de 1/5 de volta ou, em outras palavras, levará cerca de 5 segundos para se virar completamente, independentemente da taxa de quadros.

  *    rotation[1] += rotationSpeed * deltaTime;

Aqui ele está trabalhando.

{{{example url="../webgl-animation.html" }}}

Não é provável que você veja uma diferença de um no topo desta página a menos que você esteja em uma máquina lenta, mas se você não fizer sua taxa de quadros de animação independente, você provavelmente terá alguns usuários recebendo uma experiência muito diferente do que você planejou.

Em seguida <a href="webgl-3d-textures.html"> como aplicar texturas </a>.

<div class = "webgl_bottombar">
<h3> Não use setInterval ou setTimeout! </ h3>
<p> Se você programou animação em JavaScript no passado você pode ter usado <code> setInterval </ code> ou <code> setTimeout </ code> para obter o sua função de desenho a ser chamada.
</ p> <p>
Os problemas com o uso de <code> setInterval </ code> ou <code> setTimeout </ code> para fazer animação
são dois. Primeiro, os dois <code> setInterval </ code> e <code> setTimeout </ code> não têm nenhuma relação
para o navegador exibir qualquer coisa. Eles não são sincronizados quando o navegador é
vai desenhar uma nova moldura e, portanto, pode estar sem sincronia com a máquina do usuário.
Se você usar <code> setInterval </ code> ou <code> setTimeout </ code> e assumir 60 quadros
um segundo e a máquina do usuário está realmente executando alguma outra taxa de quadros que você irá
estar fora de sincronia com a máquina deles.
</ p> <p>
O outro problema é que o navegador não tem idéia de por que você está usando <code> setInterval </ code> ou
<code> setTimeout </ code>. Por exemplo, mesmo quando sua página não está visível,
como quando não é a aba da frente, o navegador ainda precisa executar seu código.
Talvez você esteja usando <code> setTimeout </ code> ou <code> setInterval </ code> para verificar
para novas mensagens ou tweets. Não há como saber para o navegador. Tudo bem se
você está apenas a verificar cada poucos segundos para novas mensagens, mas não está bom se
você está tentando desenhar 1000 objetos no WebGL. Você estará efetivamente a
<a target="_blank" href="https://pt.wikipedia.org/wiki/Ataque_de_nega%C3%A7%C3%A3o_de_servi%C3%A7o">DOS</a>
máquina do usuário com o seu desenho de tabulação invisível que eles nem conseguem ver.
</ p> <p>
<code> requestAnimationFrame </ code> resolve esses dois problemas. Chama você apenas
hora certa para sincronizar a sua animação com a tela e também só chama você se
sua aba está visível.
</ p>
</ div>
