/* Chat da Revoluzzione no site — conecta ao mesmo agente (IA) do WhatsApp/Instagram.
   Endpoint: https://2-25-195-76.sslip.io/chat */
(function () {
  'use strict';

  var API = 'https://2-25-195-76.sslip.io/chat';
  var WHATS = 'https://wa.me/5567993232387?text=' + encodeURIComponent('Olá! Vim pelo site da Revoluzzione');

  // identificador da visita (mantém o contexto da conversa)
  var sessao = localStorage.getItem('rev_chat_sessao');
  if (!sessao) {
    sessao = 'site-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('rev_chat_sessao', sessao);
  }

  var estilo = document.createElement('style');
  estilo.textContent = `
  #rev-chat-btn{position:fixed;right:20px;bottom:20px;z-index:80;display:flex;align-items:center;gap:10px;
    background:#61D9FF;color:#04101f;border:0;border-radius:999px;padding:14px 20px;font:700 15px 'Segoe UI',Roboto,Arial;
    cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45)}
  #rev-chat-btn span.dot{width:9px;height:9px;border-radius:50%;background:#0a7f4f;box-shadow:0 0 0 4px rgba(10,127,79,.25)}
  #rev-chat{position:fixed;right:20px;bottom:20px;z-index:90;width:min(380px,calc(100% - 32px));max-height:min(640px,calc(100% - 40px));
    display:none;flex-direction:column;background:#0A1428;border:1px solid #1E3352;border-radius:18px;overflow:hidden;
    box-shadow:0 24px 60px rgba(0,0,0,.6);font-family:'Segoe UI',Roboto,Arial,sans-serif}
  #rev-chat.aberto{display:flex}
  #rev-chat header{background:#070F1F;border-bottom:1px solid #1E3352;padding:14px 16px;display:flex;align-items:center;gap:10px}
  #rev-chat header .nome{flex:1}
  #rev-chat header b{color:#F7FAFF;font-size:15px;display:block}
  #rev-chat header small{color:#7fd7ff;font-size:12px}
  #rev-chat header button{background:none;border:0;color:#AAB8CC;font-size:22px;line-height:1;cursor:pointer}
  #rev-chat .corpo{padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:#0A1428}
  #rev-chat .bolha{max-width:86%;padding:10px 13px;border-radius:14px;font-size:14.5px;line-height:1.5;white-space:pre-wrap}
  #rev-chat .agente{background:#0C1830;border:1px solid #1E3352;color:#F7FAFF;border-bottom-left-radius:4px}
  #rev-chat .cliente{background:#61D9FF;color:#04101f;align-self:flex-end;border-bottom-right-radius:4px;font-weight:600}
  #rev-chat .digitando{color:#7fd7ff;font-size:13px}
  #rev-chat .sugestoes{display:flex;gap:8px;flex-wrap:wrap;padding:0 14px 10px;background:#0A1428}
  #rev-chat .sugestoes button{background:#0C1830;border:1px solid #1E3352;color:#AAB8CC;border-radius:999px;padding:7px 12px;font-size:13px;cursor:pointer}
  #rev-chat form{display:flex;gap:8px;padding:12px;border-top:1px solid #1E3352;background:#070F1F}
  #rev-chat input{flex:1;background:#0C1830;border:1px solid #1E3352;border-radius:10px;color:#F7FAFF;padding:11px 12px;font-size:14.5px}
  #rev-chat form button{background:#61D9FF;color:#04101f;border:0;border-radius:10px;padding:0 16px;font-weight:700;cursor:pointer}
  #rev-chat .rodape{font-size:11px;color:#6f8199;text-align:center;padding:0 12px 10px;background:#070F1F}
  #rev-chat .rodape a{color:#61D9FF}
  @media(max-width:520px){#rev-chat{right:8px;left:8px;bottom:8px;width:auto}}
  @keyframes revPulse{0%,100%{box-shadow:0 10px 30px rgba(0,0,0,.45)}50%{box-shadow:0 10px 34px rgba(97,217,255,.6)}}
  #rev-chat-btn{animation:revPulse 2.8s ease-in-out infinite}
  @media (prefers-reduced-motion: reduce){#rev-chat-btn{animation:none}}
  `;
  document.head.appendChild(estilo);

  var botao = document.createElement('button');
  botao.id = 'rev-chat-btn';
  botao.innerHTML = '<span class="dot"></span> Quero um orçamento';
  document.body.appendChild(botao);

  var caixa = document.createElement('div');
  caixa.id = 'rev-chat';
  caixa.innerHTML = `
    <header>
      <div class="nome"><b>Atendimento Revoluzzione</b><small>responde em segundos · 24h com IA</small></div>
      <button type="button" aria-label="Fechar">&times;</button>
    </header>
    <div class="corpo" id="rev-chat-corpo"></div>
    <div class="sugestoes" id="rev-chat-sugestoes"></div>
    <form id="rev-chat-form">
      <input id="rev-chat-input" placeholder="Escreva sua dúvida..." autocomplete="off" maxlength="500">
      <button type="submit">Enviar</button>
    </form>
    <div class="rodape">Atendimento automático com inteligência artificial · <a href="${WHATS}" target="_blank" rel="noopener">falar com uma pessoa</a></div>`;
  document.body.appendChild(caixa);

  var corpo = caixa.querySelector('#rev-chat-corpo');
  var sugestoes = caixa.querySelector('#rev-chat-sugestoes');
  var input = caixa.querySelector('#rev-chat-input');
  var form = caixa.querySelector('#rev-chat-form');
  var enviando = false;

  function bolha(texto, tipo) {
    var d = document.createElement('div');
    d.className = 'bolha ' + tipo;
    d.textContent = texto;
    corpo.appendChild(d);
    corpo.scrollTop = corpo.scrollHeight;
    return d;
  }

  function mostrarSugestoes(lista) {
    sugestoes.innerHTML = '';
    (lista || []).slice(0, 3).forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      b.onclick = function () { enviar(t); };
      sugestoes.appendChild(b);
    });
  }

  function abrir() {
    caixa.classList.add('aberto');
    botao.style.display = 'none';
    if (!corpo.children.length) {
      bolha('Olá! 👋 Aqui é o atendimento automático da Revoluzzione. A gente cria sites e agentes de IA que respondem seus clientes 24h no WhatsApp, Instagram e no próprio site.\n\nMe diz o que você procura — já te passo os valores.', 'agente');
      mostrarSugestoes(['Quanto custa?', 'O que vocês fazem?', 'Quero um site']);
    }
    setTimeout(function () { input.focus(); }, 150);
  }

  function fechar() {
    caixa.classList.remove('aberto');
    botao.style.display = 'flex';
    try { sessionStorage.setItem('rev_chat_fechado', '1'); } catch (e) {}
  }

  botao.addEventListener('click', abrir);
  caixa.querySelector('header button').addEventListener('click', fechar);

  function enviar(texto) {
    texto = (texto || '').trim();
    if (!texto || enviando) return;
    enviando = true;
    bolha(texto, 'cliente');
    input.value = '';
    sugestoes.innerHTML = '';
    var espera = bolha('digitando…', 'agente digitando');

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessao: sessao, mensagem: texto })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        espera.remove();
        bolha(d.resposta || 'Não consegui responder agora. Fale com nosso time no WhatsApp.', 'agente');
        var r = (d.resposta || '').toLowerCase();
        if (r.indexOf('wa.me') >= 0) {
          mostrarSugestoes(['Quero o diagnóstico gratuito']);
        } else {
          mostrarSugestoes(['Quanto custa?', 'Vocês atendem meu ramo?', 'Quero falar com uma pessoa']);
        }
      })
      .catch(function () {
        espera.remove();
        bolha('Tive um problema de conexão. Você pode falar com nosso time pelo WhatsApp: ' + WHATS, 'agente');
      })
      .then(function () { enviando = false; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    enviar(input.value);
  });

  // Abre sozinho uma vez a cada visita (12s) — se o visitante não fechou nem já conversou
  var jaFechou = false, jaAbriu = false;
  try {
    jaFechou = sessionStorage.getItem('rev_chat_fechado') === '1';
    jaAbriu = sessionStorage.getItem('rev_chat_visto') === '1';
  } catch (e) {}
  if (!jaFechou && !jaAbriu) {
    setTimeout(function () {
      if (caixa.classList.contains('aberto')) return;
      abrir();
      try { sessionStorage.setItem('rev_chat_visto', '1'); } catch (e) {}
    }, 12000);
  }
})();
