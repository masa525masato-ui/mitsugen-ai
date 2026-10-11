// 【Pl@ntNetを使う場合のみ】my.plantnet.org で取得したAPIキーをここに1回だけ貼る(利用者の登録は不要)
// claude.ai 上で公開して使う場合は不要です(Claudeの画像認識を使用)
var PLANTNET_API_KEY='2b101kNkWj7Y2UHUkVfXroADqe';

// [学名の前方一致, 和名, 区分, 開花時期(日本)]  ※種レベルを属レベルより先に置く
var NECTAR=[
["Astragalus sinicus","レンゲソウ","主要蜜源","4〜5月"],
["Robinia pseudoacacia","ニセアカシア(アカシア)","主要蜜源","5月"],
["Trifolium repens","シロツメクサ","主要蜜源","5〜8月"],
["Trifolium pratense","アカツメクサ","蜜源","5〜9月"],
["Trifolium","クローバー類","蜜源","5〜9月"],
["Brassica","アブラナ類(ナタネ)","主要蜜源","3〜5月"],
["Citrus","ミカン類","主要蜜源","5月"],
["Fagopyrum esculentum","ソバ","主要蜜源","8〜10月"],
["Aesculus turbinata","トチノキ","主要蜜源","5〜6月"],
["Tilia","シナノキ・菩提樹類","主要蜜源","6〜7月"],
["Castanea","クリ","主要蜜源","6月"],
["Solidago altissima","セイタカアワダチソウ","主要蜜源","10〜11月"],
["Helianthus annuus","ヒマワリ","蜜源","7〜9月"],
["Phellodendron","キハダ","蜜源","6月"],
["Rhus javanica","ヌルデ","蜜源","8〜9月"],
["Eriobotrya japonica","ビワ","蜜源","11〜1月"],
["Fatsia japonica","ヤツデ","蜜源","11〜12月"],
["Diospyros kaki","カキ","蜜源","5〜6月"],
["Salix","ヤナギ類","蜜源","3〜4月"],
["Prunus","サクラ・ウメ・モモ類","蜜源","2〜4月"],
["Malus","リンゴ類","蜜源","4〜5月"],
["Pyrus","ナシ類","蜜源","4月"],
["Fragaria","イチゴ類","蜜源","4〜5月"],
["Taraxacum","タンポポ類","蜜源","3〜5月"],
["Lespedeza","ハギ類","蜜源","8〜9月"],
["Wisteria","フジ類","蜜源","4〜5月"],
["Eucalyptus","ユーカリ類","蜜源","通年(種による)"],
["Lavandula","ラベンダー類","蜜源","6〜8月"],
["Borago","ボリジ","蜜源","5〜8月"],
["Salvia","サルビア類","蜜源","6〜10月"],
["Thymus","タイム類","蜜源","5〜7月"],
["Mentha","ミント類","蜜源","7〜9月"],
["Origanum","オレガノ類","蜜源","7〜9月"],
["Allium","ネギ・ニラ類","蜜源","6〜9月"],
["Ligustrum","ネズミモチ・イボタ類","蜜源","6月"],
["Styrax japonicus","エゴノキ","蜜源","5〜6月"],
["Camellia sasanqua","サザンカ","花粉源のみ","10〜12月"],
["Camellia japonica","ツバキ","花粉源のみ","2〜4月"],
["Cosmos","コスモス","花粉源のみ","9〜11月"],
["Papaver","ケシ類","花粉源のみ","5〜6月"],
["Zea mays","トウモロコシ","花粉源のみ","7〜8月"],
["Pueraria","クズ","蜜源","8〜9月"],
["Vicia","ソラマメ・ヤハズエンドウ類","蜜源","3〜5月"],
["Cirsium","アザミ類","蜜源","5〜10月"]
];

(function(){
  var $=function(i){return document.getElementById(i)};
  var out=$('out'),prev=$('prev'),go=$('go'),blob=null;

  function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML}

  /* ---------- 画像の読み込み・縮小 ---------- */
  function shrink(file){
    return new Promise(function(res,rej){
      var img=new Image(),url=URL.createObjectURL(file);
      img.onload=function(){
        var s=Math.min(1,1280/Math.max(img.width,img.height)),c=document.createElement('canvas');
        c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        c.toBlob(function(b){URL.revokeObjectURL(url);b?res(b):rej(new Error('変換失敗'))},'image/jpeg',.85);
      };
      img.onerror=function(){rej(new Error('画像を読み込めません'))};
      img.src=url;
    });
  }
  function onFile(e){
    var f=e.target.files&&e.target.files[0];if(!f)return;
    out.innerHTML='';
    shrink(f).then(function(b){blob=b;prev.src=URL.createObjectURL(b);prev.style.display='block';go.style.display='block'})
    .catch(function(x){out.innerHTML='<div class="card err">'+esc(x.message)+'</div>'});
    e.target.value='';
  }
  $('cam').onchange=onFile;$('pick').onchange=onFile;

  /* ---------- 蜜源リスト照合 ---------- */
  function lookup(sci){
    for(var i=0;i<NECTAR.length;i++) if((sci||'').indexOf(NECTAR[i][0])===0) return NECTAR[i];
    return null;
  }
  function badge(n){
    var c=n==='主要蜜源'||n==='蜜源'?'var(--ok)':n==='花粉源のみ'?'var(--mid)':'var(--no)';
    return '<span class="badge" style="color:'+c+'">'+esc(n)+'</span>';
  }

  /* ---------- 結果表示 (共通形式 r) ----------
     r = {notPlant, name, sci, score(0-100), family, alts[], ai:{nectar,reason,bloom,bees}|null} */
  function render(r){
    if(!r||r.notPlant){out.innerHTML='<div class="card">植物を特定できませんでした。花や葉が大きく写るように撮り直してください。</div>';return}
    var h='<div class="card"><div class="name">'+esc(r.name||r.sci)+'</div><div class="sci">'+esc(r.sci)+'　一致度 '+Math.round(r.score)+'%</div>';
    var hit=lookup(r.sci);
    if(hit){
      h+=badge(hit[2])+'<div class="row"><b>リスト上の名称</b>'+esc(hit[1])+'</div><div class="row"><b>開花</b>'+esc(hit[3])+'</div>';
    }else if(r.ai){
      h+=badge(r.ai.nectar||'不明')+'<div class="row">'+esc(r.ai.reason)+'</div>';
      if(r.ai.bloom) h+='<div class="row"><b>開花</b>'+esc(r.ai.bloom)+'</div>';
      if(r.ai.bees) h+='<div class="row"><b>訪花</b>'+esc(r.ai.bees)+'</div>';
      h+='<div class="row"><b>判定元</b>AIの推定(内蔵リスト外)</div>';
    }else{
      h+=badge('リスト外(不明)')+'<div class="row">内蔵の蜜源リストに該当がありません。蜜源でないとは限りません。</div>';
    }
    if(r.family) h+='<div class="row"><b>科</b>'+esc(r.family)+'</div>';
    if(r.alts&&r.alts.length) h+='<div class="row"><b>他の候補</b>'+r.alts.map(esc).join('、')+'</div>';
    out.innerHTML=h+'</div>';
  }

  /* ---------- 判定1: Claude画像認識 (claude.ai上で公開した場合) ---------- */
  var PROMPT='添付画像の植物を判定し、次のJSONのみを返してください(前置き・コードフェンス不要)。\n'+
  '{"is_plant":true/false,"name_ja":"和名","scientific":"学名(属名+種小名)","family":"科","confidence":0〜100の整数,"alternatives":["別候補の和名",最大2件],'+
  '"nectar":"主要蜜源|蜜源|花粉源のみ|蜜源ではない|不明","nectar_reason":"日本の養蜂での利用を根拠に1〜2文","bloom":"開花時期(日本)","bees":"訪花昆虫の補足を1文"}\n'+
  '植物が写っていなければ is_plant を false にする。確信がなければ confidence を下げ、nectar を「不明」にする。';

  var sampleP=null;
  function getSample(){
    if(!sampleP){
      sampleP=(window.claude&&window.claude.use)
        ? window.claude.use('sample').then(function(s){
            if(!s) return null;
            return s.limits?s.limits().then(function(l){return l&&l.images?s:null}):s;
          }).catch(function(){return null})
        : Promise.resolve(null);
    }
    return sampleP;
  }
  function runClaude(sample){
    return sample(PROMPT,{images:[blob],cache:false}).then(function(res){
      var t=(res.text||'').replace(/```json|```/g,'').trim();
      var j=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));
      if(!j.is_plant) return {notPlant:true};
      return {name:j.name_ja,sci:j.scientific,score:j.confidence||0,family:j.family,alts:j.alternatives||[],
              ai:{nectar:j.nectar,reason:j.nectar_reason,bloom:j.bloom,bees:j.bees}};
    });
  }

  /* ---------- 判定2: Pl@ntNet API (自分のサーバー等で公開した場合) ---------- */
  function runPlantnet(){
    if(!PLANTNET_API_KEY) return Promise.reject(new Error('管理者向け: script.js 上部の PLANTNET_API_KEY を設定してください。'));
    var fd=new FormData();
    fd.append('images',blob,'photo.jpg');
    fd.append('organs','auto');
    return fetch('https://my-api.plantnet.org/v2/identify/all?lang=ja&nb-results=5&api-key='+encodeURIComponent(PLANTNET_API_KEY),{method:'POST',body:fd})
    .then(function(r){
      if(r.status===404) return {results:[]};
      if(!r.ok) throw new Error('判定に失敗しました (HTTP '+r.status+')。APIキーや利用上限を確認してください。');
      return r.json();
    })
    .then(function(j){
      var rs=j.results||[];
      if(!rs.length) return {notPlant:true};
      function nm(s){return (s.commonNames&&s.commonNames[0])||s.scientificNameWithoutAuthor}
      var sp=rs[0].species;
      return {name:nm(sp),sci:sp.scientificNameWithoutAuthor,score:rs[0].score*100,
              family:sp.family&&sp.family.scientificNameWithoutAuthor,
              alts:rs.slice(1,4).map(function(r){return nm(r.species)+' ('+Math.round(r.score*100)+'%)'}),ai:null};
    });
  }

  /* ---------- 実行: Claudeが使えればClaude、なければPl@ntNet ---------- */
  go.onclick=function(){
    if(!blob)return;
    go.disabled=true;out.innerHTML='<div class="card">判定中…</div>';
    getSample().then(function(s){return s?runClaude(s):runPlantnet()})
    .then(render)
    .catch(function(x){
      var m=x&&x.code==='not_granted'?'判定の許可が必要です。もう一度お試しください。'
           :x&&x.code==='rate_limited'?'混み合っています。少し待ってからお試しください。'
           :(x&&x.message)||'判定に失敗しました。';
      out.innerHTML='<div class="card err">'+esc(m)+'</div>';
    })
    .then(function(){go.disabled=false});
  };
})();
