Title: トレイル効果を使った動く線を書く方法
Description: トレイル効果を使った動く線を書く方法
TOC: トレイル効果を使った動く線を書く方法

## 質問

どのように下記デモにあるような線を描くのか？トレイル効果(trailing effects)でシンプルな線を描くことは簡単に思えるかもしれません。しかし、これらの線は屈折しています。

http://uber.github.io/deck.gl/#/examples/custom-layers/trip-routes

## 回答

線のUV座標を渡すか、UV座標を生成し、それらを使用して線に色をつけることができます。時間を渡すと次のようなスクロールができます。

{{{example url="../webgl-qna-how-to-achieve-moving-line-with-trail-effects-example-1.html"}}}

もちろん、色のコードの代わりにテクスチャを使うこともできます。

{{{example url="../webgl-qna-how-to-achieve-moving-line-with-trail-effects-example-2.html"}}}

<div class="so">
  <div>質問とその引用箇所は
    <a data-href="http://miaokaixiang.com">K.Miao</a>によるCC BY-SA 3.0
    <a data-href="https://stackoverflow.com/questions/44768471">こちら</a>
    です。
  </div>
</div>
