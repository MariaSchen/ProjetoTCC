// script.js — Acess Path (carrossel + formulários + VLibras + botão de voz ON/OFF)
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  // -----------------------------
  // Utilitário: região de status (para mensagens acessíveis)
  // -----------------------------
  const srStatus = document.getElementById('sr-status');
  function announce(msg) {
    if (!srStatus) return;
    srStatus.textContent = '';
    setTimeout(() => (srStatus.textContent = msg), 10); // força aria-live
  }

  // -----------------------------
  // Toast global (reaproveita #tts-toast)
  // -----------------------------
  function toast(msg, ms = 2000) {
    const t = document.getElementById('tts-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), ms);
  }

  // -----------------------------
  // Carrossel com fade + acessibilidade
  // -----------------------------
  const carousel = document.querySelector('.carousel-fade');
  if (carousel) {
    const slides = carousel.querySelectorAll('.slide');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    const dots = carousel.querySelectorAll('.dot');
    let current = 0;
    let autoplayId = null;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
        dot.setAttribute('tabindex', i === index ? '0' : '-1');
      });
      current = index;
    }

    function next() { showSlide((current + 1) % slides.length); }
    function prev() { showSlide((current - 1 + slides.length) % slides.length); }

    prevBtn?.addEventListener('click', prev);
    nextBtn?.addEventListener('click', next);

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const i = parseInt(dot.getAttribute('data-index')) || 0;
        showSlide(i);
      });
      dot.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const i = parseInt(dot.getAttribute('data-index')) || 0;
          showSlide(i);
        }
      });
    });

    // Acesso via teclado (setas)
    carousel.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); next(); }
      if (ev.key === 'ArrowLeft')  { ev.preventDefault(); prev(); }
    });

    function startAutoplay() {
      stopAutoplay();
      autoplayId = setInterval(next, 5000);
    }
    function stopAutoplay() {
      if (autoplayId) clearInterval(autoplayId);
      autoplayId = null;
    }

    // Pausa autoplay quando o usuário interage
    [prevBtn, nextBtn, ...dots].forEach((el) => {
      el?.addEventListener('focus', stopAutoplay);
      el?.addEventListener('mouseover', stopAutoplay);
      el?.addEventListener('blur', startAutoplay);
      el?.addEventListener('mouseout', startAutoplay);
    });

    showSlide(0);
    startAutoplay();
  }

  // -----------------------------
  // Helpers para formulários (validação leve, máscara, contador)
  // -----------------------------
  function addInvalidHighlighting(form) {
    // Limpa classes ao editar e marca inválidos ao blur
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', () => el.classList.remove('is-invalid', 'form-success'));
      el.addEventListener('blur', () => {
        if (!el.checkValidity()) el.classList.add('is-invalid');
      });
    });
  }

  function maskTel(v) {
    return v.replace(/\D/g,'')
      .replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_,a,b,c) => {
        let out = '';
        if (a) out = '(' + a + (a.length === 2 ? ') ' : '');
        if (b) out += b + (b.length === 5 ? '-' : '');
        if (c) out += c;
        return out;
      });
  }

  // -----------------------------
  // FORM: Cadastro
  // -----------------------------
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    addInvalidHighlighting(formCadastro);
    formCadastro.addEventListener('submit', (e) => {
      e.preventDefault();

      // valida
      const invalids = [...formCadastro.querySelectorAll('input, select, textarea')].filter(el => !el.checkValidity());
      if (invalids.length) {
        invalids.forEach(el => el.classList.add('is-invalid'));
        announce('Há campos obrigatórios para preencher no cadastro.');
        toast('Revise os campos destacados.');
        invalids[0].focus();
        return;
      }

      const nome = document.getElementById('nome')?.value || '';
      const email = document.getElementById('email')?.value || '';
      toast(`Cadastro enviado! Bem-vindo(a), ${nome}.`);
      announce('Cadastro enviado com sucesso.');
      formCadastro.reset();
    });
  }

  // -----------------------------
  // FORM: Compra
  // -----------------------------
  const formCompra = document.getElementById('form-compra');
  if (formCompra) {
    addInvalidHighlighting(formCompra);
    formCompra.addEventListener('submit', (e) => {
      e.preventDefault();

      const invalids = [...formCompra.querySelectorAll('input, select, textarea')].filter(el => !el.checkValidity());
      if (invalids.length) {
        invalids.forEach(el => el.classList.add('is-invalid'));
        announce('Há campos obrigatórios para preencher na compra.');
        toast('Revise os campos destacados.');
        invalids[0].focus();
        return;
      }

      const nome = document.getElementById('nome')?.value || '';
      const quantidade = document.getElementById('quantidade')?.value || '';
      const pagamento = document.getElementById('pagamento')?.value || '';
      toast(`Compra registrada: ${quantidade} unidade(s) via ${String(pagamento).toUpperCase()}.`);
      announce('Compra enviada com sucesso.');
      formCompra.reset();
    });
  }

  // -----------------------------
  // FORM: Contato (com máscara, contador e feedback visual)
  // -----------------------------
  const formContato = document.getElementById('form-contato');
  if (formContato) {
    addInvalidHighlighting(formContato);

    const tel = document.getElementById('telefone');
    const msg = document.getElementById('mensagem');
    const counter = document.getElementById('contagem');

    // Máscara telefone
    tel?.addEventListener('input', e => e.target.value = maskTel(e.target.value));

    // Contador de caracteres
    function updateCount() {
      if (!msg || !counter) return;
      counter.textContent = `${msg.value.length}/${msg.maxLength || 600}`;
    }
    msg?.addEventListener('input', updateCount);
    updateCount();

    formContato.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validação nativa + realce
      const inputs = [...formContato.querySelectorAll('input, select, textarea')];
      inputs.forEach(el => el.classList.remove('is-invalid', 'form-success'));

      const invalids = inputs.filter(el => !el.checkValidity());
      if (invalids.length) {
        invalids.forEach(el => el.classList.add('is-invalid'));
        announce('Há campos obrigatórios para preencher no contato.');
        toast('Revise os campos destacados.');
        invalids[0].focus();
        return;
      }

      // Sucesso (mock)
      inputs.forEach(el => el.classList.add('form-success'));

      const nome = document.getElementById('nome')?.value || '';
      const assunto = document.getElementById('assunto')?.value || '';
      toast(`Mensagem enviada! Obrigado, ${nome}.`);
      announce('Mensagem enviada com sucesso. Nossa equipe retornará em breve.');

      formContato.reset();
      updateCount();
    });
  }

  // -----------------------------
  // VLibras + Botão de voz (toggle ON/OFF + leitura por clique)
  // -----------------------------
  (function(){
    // 1) Inicializa VLibras quando disponível (tenta novamente se atrasar)
    function initVLibras(){
      try{
        if (window.VLibras && window.VLibras.Widget) {
          new window.VLibras.Widget('https://vlibras.gov.br/app');
          announce('VLibras carregado. Use o botão flutuante para ativar.');
        } else {
          setTimeout(initVLibras, 600);
        }
      }catch(e){}
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initVLibras);
    } else {
      initVLibras();
    }

    // 2) Elementos + estado
    const btn = document.getElementById('tts-mini');
    const toastEl = document.getElementById('tts-toast'); // usado pelo toast global
    let ttsEnabled = false;         // 🔑 modo ON/OFF
    let currentUtterance = null;

    // 3) Helpers
    function getSelectedText(){
      const sel = window.getSelection && window.getSelection();
      return sel ? String(sel.toString() || '') : '';
    }
    function stopSpeak(){
      try{ window.speechSynthesis.cancel(); }catch(e){}
      btn?.setAttribute('data-speaking','false');
      announce('Leitura interrompida.');
    }
    function speak(text){
      if (!ttsEnabled) return; // respeita o modo desligado
      if (!('speechSynthesis' in window)) { toast('Seu navegador não suporta leitura por voz.'); return; }
      const cleaned = (text || '').replace(/\s+/g,' ').trim();
      if (!cleaned){ toast('Selecione um texto ou clique em um parágrafo.'); return; }

      // Para qualquer leitura pendente e inicia nova
      window.speechSynthesis.cancel();
      currentUtterance = new SpeechSynthesisUtterance(cleaned);
      currentUtterance.lang = 'pt-BR';
      currentUtterance.rate = 1;
      currentUtterance.pitch = 1;

      currentUtterance.onstart = () => { btn?.setAttribute('data-speaking','true'); announce('Leitura iniciada.'); };
      currentUtterance.onend   = () => { btn?.setAttribute('data-speaking','false'); announce('Leitura concluída.'); };
      currentUtterance.onerror = () => { btn?.setAttribute('data-speaking','false'); toast('Falha ao reproduzir a voz.'); };

      window.speechSynthesis.speak(currentUtterance);
    }

    // 4) Clique no botão: alterna ON/OFF; se estava lendo e vai desligar, para
    if (btn){
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Se estiver falando E o usuário clicar para desativar, paramos a leitura.
        if (ttsEnabled) {
          // Desliga
          ttsEnabled = false;
          btn.removeAttribute('data-enabled');
          btn.setAttribute('data-speaking','false');
          stopSpeak();
          toast('Leitura por voz desativada.');
          return;
        }

        // Liga
        ttsEnabled = true;
        btn.setAttribute('data-enabled','true');
        toast('Leitura por voz ativada.');

        // Dica: se já houver seleção, não fala automaticamente; mantém seu fluxo
        const selected = getSelectedText();
        if (selected.trim()){
          toast('Texto selecionado: clique em um parágrafo para ouvir.', 1800);
        }
      });
    }

    // 5) Clique em textos do conteúdo (apenas quando ON) — evita links e áreas do VLibras
    function attachSpeakHandlers(){
      const selectors = [
        '.speakable p', '.speakable h1', '.speakable h2', '.speakable h3', '.speakable li',
        'main p', 'main h1', 'main h2', 'main h3', 'main li'
      ];
      document.querySelectorAll(selectors.join(',')).forEach((el) => {
        el.addEventListener('click', (ev) => {
          if (!ttsEnabled) return; // OFF => não faz nada
          if (ev.target.closest('[vw],[vw-plugin-wrapper],[vw-access-button]')) return;
          if (ev.target.closest('a')) return; // não falar ao clicar em links

          // Prioriza seleção do usuário; se não tiver, lê o elemento
          const sel = getSelectedText();
          const txt = (sel.trim()) ? sel : (el.innerText || el.textContent || '');
          speak(txt);
        });
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachSpeakHandlers);
    } else {
      attachSpeakHandlers();
    }

    // 6) Sincroniza POSIÇÃO: coloca o botão ACIMA do VLibras (CENTRALIZADO)
function getVLibrasButton() {
  // tenta diferentes seletores que o plugin usa
  return document.querySelector('[vw-access-button]') ||
         document.querySelector('[vw] [vw-access-button]') ||
         document.querySelector('.vpw-toggle') ||
         document.querySelector('.vpw-bt-acessibilidade');
}

function syncWithVLibras(){
  const acc = getVLibrasButton();
  if (!acc || !btn) return;

  const r  = acc.getBoundingClientRect();  // VLibras
  const rb = btn.getBoundingClientRect();  // TTS
  const GAP = 12;

  // --- HORIZONTAL: centro do TTS alinhado ao centro do VLibras ---
  // distância do VLibras até a borda direita
  const rightEdge = window.innerWidth - r.right;
  // diferença de larguras para centralizar
  const centerShift = (r.width - rb.width) / 2;
  const right = Math.max(12, rightEdge + centerShift);
  btn.style.right = right + 'px';
  if (toastEl) toastEl.style.right = right + 'px';

  // --- VERTICAL: TTS fica ACIMA do VLibras, com um GAP fixo ---
  const bottomEdge = window.innerHeight - r.bottom;
  const bottom = Math.max(12, bottomEdge + r.height + GAP);
  btn.style.bottom = bottom + 'px';

  // posiciona o toast um pouco acima do TTS
  if (toastEl) toastEl.style.bottom = (bottom + rb.height + 8) + 'px';
}

window.addEventListener('load', () => {
  syncWithVLibras();
  setTimeout(syncWithVLibras, 600);
  setTimeout(syncWithVLibras, 1200);
});
window.addEventListener('resize', syncWithVLibras);

// Observa mudanças no DOM para pegar quando o VLibras injeta/move o botão
const mo = new MutationObserver(syncWithVLibras);
mo.observe(document.documentElement, { childList: true, subtree: true });


    // 7) Segurança: ao sair da página, cancela a fala
    window.addEventListener('beforeunload', () => stopSpeak());
  })();
})();


(function () {
  // ----- Orçamento (compra.html) -----
  const $ = (sel) => document.querySelector(sel);

  const formOrc = $('#form-orcamento');
  const resultado = $('#resultado-orcamento');
  const tabela = $('#tabela-itens');
  const totalGeral = $('#total-geral');

  const inputAmb = $('#ambientes');
  const inputArea = $('#areaTotal');

  const precoSensor = $('#precoSensor');
  const precoFone = $('#precoFone');
  const precoMaoObra = $('#precoMaoObra');
  const m2PorSensor = $('#m2PorSensor');
  const minSensorAmb = $('#minSensorAmb');

  const btnCalc = $('#btnCalcular');

  // Campos que o formulário de compra recebe
  const inputQtdCompra = $('#quantidade');
  const inputValorEstimado = $('#valorEstimado');
  const inputOrcamentoJson = $('#orcamento-json');

  function moeda(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function calcularOrcamento() {
    // Entradas principais
    const ambientes = Math.max(1, parseInt(inputAmb.value || '1', 10));
    const areaTotal = Math.max(1, parseInt(inputArea.value || '1', 10));

    // Configs (podem ser alteradas no <details>)
    const pSensor = Math.max(0, parseFloat(precoSensor.value || '0'));
    const pFone = Math.max(0, parseFloat(precoFone.value || '0'));
    const pMao = Math.max(0, parseFloat(precoMaoObra.value || '0'));
    const ratio = Math.max(1, parseInt(m2PorSensor.value || '1', 10));
    const minPorAmb = Math.max(1, parseInt(minSensorAmb.value || '1', 10));

    // Regra:
    // - sensores: pelo menos minPorAmb por ambiente; adicional: 1 sensor a cada 'ratio' m² em média por ambiente
    const areaMediaAmb = areaTotal / ambientes;
    const sensoresPorAmb = Math.max(minPorAmb, Math.ceil(areaMediaAmb / ratio));
    const sensoresTotal = ambientes * sensoresPorAmb;

    // - fones+receptor: 1 por ambiente
    const fonesTotal = ambientes;

    // - mão de obra: por ambiente
    const maoObraTotal = ambientes;

    // Subtotais
    const subtotalSensores = sensoresTotal * pSensor;
    const subtotalFones = fonesTotal * pFone;
    const subtotalMaoObra = maoObraTotal * pMao;
    const total = subtotalSensores + subtotalFones + subtotalMaoObra;

    // Render da “tabela”
    tabela.innerHTML = `
      <div role="rowgroup">
        <div role="row" class="row head" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:.5rem;font-weight:600">
          <div role="columnheader">Item</div>
          <div role="columnheader">Qtd.</div>
          <div role="columnheader">Unit.</div>
          <div role="columnheader">Subtotal</div>
        </div>
        <div role="row" class="row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:.5rem;margin-top:.5rem">
          <div role="cell">Sensor RFID</div>
          <div role="cell">${sensoresTotal}</div>
          <div role="cell">${moeda(pSensor)}</div>
          <div role="cell">${moeda(subtotalSensores)}</div>
        </div>
        <div role="row" class="row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:.5rem;margin-top:.25rem">
          <div role="cell">Kit núcleo (fone + receptor + Raspberry)</div>
          <div role="cell">${fonesTotal}</div>
          <div role="cell">${moeda(pFone)}</div>
          <div role="cell">${moeda(subtotalFones)}</div>
        </div>
        <div role="row" class="row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:.5rem;margin-top:.25rem">
          <div role="cell">Mão de obra (por ambiente)</div>
          <div role="cell">${maoObraTotal}</div>
          <div role="cell">${moeda(pMao)}</div>
          <div role="cell">${moeda(subtotalMaoObra)}</div>
        </div>
      </div>
    `;

    totalGeral.textContent = `Total estimado: ${moeda(total)}`;

    // Preenche o formulário de compra automaticamente
    if (inputQtdCompra) inputQtdCompra.value = ambientes;
    if (inputValorEstimado) inputValorEstimado.value = total.toFixed(2).replace('.', ',');
    if (inputOrcamentoJson) {
      const payload = {
        ambientes,
        areaTotal,
        regras: { m2PorSensor: ratio, minimoSensoresPorAmbiente: minPorAmb },
        itens: {
          sensores: { quantidade: sensoresTotal, unitario: pSensor, subtotal: subtotalSensores },
          fones: { quantidade: fonesTotal, unitario: pFone, subtotal: subtotalFones },
          maoDeObra: { quantidade: maoObraTotal, unitario: pMao, subtotal: subtotalMaoObra }
        },
        total
      };
      inputOrcamentoJson.value = JSON.stringify(payload);
    }
  }

  if (btnCalc && formOrc && resultado) {
    btnCalc.addEventListener('click', () => {
      calcularOrcamento();
      // Se você usa o toast global:
      if (typeof toast === 'function') toast('Orçamento atualizado!');
    });

    // Atualiza ao mudar os campos (opcional — deixa mais dinâmico)
    ['change', 'input'].forEach(evt => {
      formOrc.addEventListener(evt, (e) => {
        // Evita recalcular a cada tecla nas configs escondidas se não estiverem abertas
        if (e.target.closest('details') && !e.target.closest('details').open) return;
        calcularOrcamento();
      });
    });

    // Cálculo inicial
    calcularOrcamento();
  }
})();

// ===== Gate de autenticação (compra.html) =====
(function () {
  const gate = document.getElementById('auth-gate');
  // Presença da calculadora/pedido = estamos na compra.html
  const onCompra = document.getElementById('form-orcamento') || document.getElementById('form-compra');
  if (!onCompra || !gate) return;

  const isLoggedIn = () => localStorage.getItem('ap_auth') === '1';

  function lockPage() {
    document.body.classList.add('modal-open');
    // Embaça tudo atrás do modal
    ['header','main','footer','#tts-mini','.enabled[vw]'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.classList.add('is-blurred');
    });
    gate.hidden = false;

    // Foco inicial no 1º botão
    const first = gate.querySelector('button, [href], [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();

    // Trap de foco simples e tecla ESC volta ao início
    gate.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { window.location.href = 'index.html'; }
      if (e.key !== 'Tab') return;
      const fEls = gate.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const focusable = Array.from(fEls).filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const firstEl = focusable[0];
      const lastEl  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { lastEl.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { firstEl.focus(); e.preventDefault(); }
    });
  }

  function unlockPage() {
    document.body.classList.remove('modal-open');
    ['header','main','footer','#tts-mini','.enabled[vw]'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.classList.remove('is-blurred');
    });
    gate.hidden = true;
  }

  // Se não estiver logado, trava a página e mostra o modal
  if (!isLoggedIn()) {
    lockPage();

    // Botões do modal → cadastro/login com redirect de volta
    const redirect = encodeURIComponent(location.pathname + location.search);
    const goSignup = document.getElementById('go-signup');
    const goLogin  = document.getElementById('go-login');

    if (goSignup) goSignup.addEventListener('click', () => {
      window.location.href = `cadastro.html?mode=signup&redirect=${redirect}`;
    });
    if (goLogin) goLogin.addEventListener('click', () => {
      window.location.href = `cadastro.html?mode=login&redirect=${redirect}`;
    });
  } else {
    // Já “logado”: garante que nada fique embaçado
    unlockPage();
  }
})();

/* ================================
   AUTENTICAÇÃO (protótipo front-end)
   - Alterna abas cadastro/login
   - Marca sessão em localStorage
   - Redireciona de volta com ?redirect=
   - Mostra ícone de logado no header em todo o site
==================================*/
(function(){
  // ---------- Util ----------
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const params = new URLSearchParams(location.search);
  const isLoggedIn = () => localStorage.getItem('ap_auth') === '1';

  // ---------- Indicador no header (injetado em todas as páginas) ----------
  (function ensureAuthIndicator(){
    const navUl = document.querySelector('header .main-nav ul');
    if (!navUl) return;

    // cria só 1x
    if (!$('#auth-indicator')) {
      const liBadge = document.createElement('li');
      liBadge.className = 'auth-li';
      liBadge.innerHTML = `<span id="auth-indicator" class="auth-badge" data-state="out" aria-live="polite">🔒 Convidado</span>`;
      navUl.appendChild(liBadge);

      const liLogout = document.createElement('li');
      liLogout.className = 'auth-li';
      liLogout.innerHTML = `<a href="#" id="logout-link" class="logout-link" hidden>Sair</a>`;
      navUl.appendChild(liLogout);

      $('#logout-link')?.addEventListener('click', (e)=>{
        e.preventDefault();
        localStorage.removeItem('ap_auth');
        localStorage.removeItem('ap_user');
        // se estiver na compra, a página vai travar novamente por causa do gate
        location.reload();
      });
    }

    const badge = $('#auth-indicator');
    const logout = $('#logout-link');
    const user = JSON.parse(localStorage.getItem('ap_user') || 'null');

    if (isLoggedIn()) {
      const nome = user?.name || user?.email || 'Usuário';
      badge.dataset.state = 'in';
      badge.textContent = `✅ Logado: ${nome}`;
      if (logout) logout.hidden = false;
    } else {
      badge.dataset.state = 'out';
      badge.textContent = '🔒 Convidado';
      if (logout) logout.hidden = true;
    }
  })();

  // ---------- Página cadastro: abas e submissão ----------
  const tabSignup = $('#tab-signup');
  const tabLogin  = $('#tab-login');
  const panelSignup = $('#panel-signup');
  const panelLogin  = $('#panel-login');

  function activateTab(which){ // "signup" | "login"
    const isSignup = which === 'signup';
    tabSignup?.classList.toggle('is-active', isSignup);
    tabLogin?.classList.toggle('is-active', !isSignup);
    tabSignup?.setAttribute('aria-selected', isSignup ? 'true' : 'false');
    tabLogin?.setAttribute('aria-selected', !isSignup ? 'true' : 'false');
    panelSignup?.toggleAttribute('hidden', !isSignup);
    panelLogin?.toggleAttribute('hidden', isSignup);
    (isSignup ? panelSignup : panelLogin)?.focus();
  }

  // Abas via clique
  tabSignup?.addEventListener('click', ()=> activateTab('signup'));
  tabLogin?.addEventListener('click',  ()=> activateTab('login'));
  // Links no rodapé de cada formulário
  $('#link-go-login')?.addEventListener('click', (e)=>{ e.preventDefault(); activateTab('login'); });
  $('#link-go-signup')?.addEventListener('click', (e)=>{ e.preventDefault(); activateTab('signup'); });

  // Define aba inicial por ?mode=
  const mode = params.get('mode'); // signup|login
  if (mode === 'login') activateTab('login'); else activateTab('signup');

  // ---------- SUBMIT: Criar conta ----------
  $('#form-cadastro-signup')?.addEventListener('submit', function(e){
    // e.preventDefault(); // remova quando integrar backend real
    const nome = $('#su-nome')?.value?.trim();
    const email = $('#su-email')?.value?.trim();
    const email2= $('#su-email-conf')?.value?.trim();
    const s1 = $('#su-senha')?.value || '';
    const s2 = $('#su-senha-conf')?.value || '';
    const termos = $('#su-termos')?.checked;

    let ok = true;
    // validações simples de protótipo
    const mark = (el, v) => el && el.classList.toggle('is-invalid', !v);
    mark($('#su-nome'), !!nome);
    mark($('#su-email'), !!email);
    mark($('#su-email-conf'), email === email2 && !!email);
    mark($('#su-senha'), s1.length >= 6);
    mark($('#su-senha-conf'), s1 === s2 && s2.length >= 6);
    mark($('#su-termos'), !!termos);

    ok = !!(nome && email && email2 && s1.length>=6 && s1===s2 && termos);
    if (!ok) { announce?.('Verifique os campos destacados.'); e.preventDefault(); return; }

    // sucesso (simulado)
    localStorage.setItem('ap_auth','1');
    localStorage.setItem('ap_user', JSON.stringify({ name:nome, email }));
    const back = params.get('redirect') || 'compra.html';
    // deixa o navegador seguir o submit real se você tiver backend;
    // como protótipo, redirecionamos:
    e.preventDefault();
    location.href = back;
  });

  // ---------- SUBMIT: Login ----------
  $('#form-cadastro-login')?.addEventListener('submit', function(e){
    // e.preventDefault(); // remova quando integrar backend real
    const email = $('#li-email')?.value?.trim();
    const senha = $('#li-senha')?.value || '';
    const ok = !!(email && senha);
    if (!ok) { 
      $('#li-email')?.classList.toggle('is-invalid', !email);
      $('#li-senha')?.classList.toggle('is-invalid', !senha);
      announce?.('Preencha e-mail e senha.');
      e.preventDefault();
      return;
    }

    // sucesso (simulado)
    localStorage.setItem('ap_auth','1');
    localStorage.setItem('ap_user', JSON.stringify({ email }));
    const back = params.get('redirect') || 'compra.html';
    e.preventDefault();
    location.href = back;
  });

  // Região de status acessível global (se existir)
  function announce(msg){
    const sr = document.getElementById('sr-status');
    if (!sr) return;
    sr.textContent = '';
    setTimeout(()=> sr.textContent = msg, 10);
  }
})();

/* ================================
   AUTH HELPER (localStorage)
==================================*/
(function(){
  const Auth = {
    in: () => localStorage.getItem('ap_auth') === '1',
    user: () => { try { return JSON.parse(localStorage.getItem('ap_user')||'null'); } catch { return null; } },
    login: (u) => { localStorage.setItem('ap_auth','1'); if (u) localStorage.setItem('ap_user', JSON.stringify(u)); renderAuthBadge(); },
    logout: () => { localStorage.removeItem('ap_auth'); localStorage.removeItem('ap_user'); renderAuthBadge(); }
  };
  window.__AP_Auth = Auth; // expõe pra uso em outras partes se precisar

  /* ---------- Badge no header (todas as páginas) ---------- */
  function ensureBadge(){
    const navUl = document.querySelector('header .main-nav ul');
    if (!navUl) return;
    if (!document.getElementById('auth-indicator')){
      const liBadge = document.createElement('li');
      liBadge.className = 'auth-li';
      liBadge.innerHTML = `<span id="auth-indicator" class="auth-badge" data-state="out" aria-live="polite">🔒 Convidado</span>`;
      navUl.appendChild(liBadge);

      const liLogout = document.createElement('li');
      liLogout.className = 'auth-li';
      liLogout.innerHTML = `<a href="#" id="logout-link" class="logout-link" hidden>Sair</a>`;
      navUl.appendChild(liLogout);

      document.getElementById('logout-link')?.addEventListener('click', (e)=>{
        e.preventDefault();
        Auth.logout();
        // se estiver na compra, recarrega para re-exibir o gate
        if (location.pathname.endsWith('compra.html')) location.reload();
      });
    }
  }

  function renderAuthBadge(){
    const badge = document.getElementById('auth-indicator');
    const logout = document.getElementById('logout-link');
    if (!badge) return;
    if (Auth.in()){
      const u = Auth.user();
      const nome = (u?.name || u?.email || 'Usuário');
      badge.dataset.state = 'in';
      badge.textContent = `✅ Logado: ${nome}`;
      if (logout) logout.hidden = false;
    } else {
      badge.dataset.state = 'out';
      badge.textContent = '🔒 Convidado';
      if (logout) logout.hidden = true;
    }
  }

  /* ---------- Gate em compra.html ---------- */
  function setupGate(){
    const gate = document.getElementById('auth-gate');
    if (!gate) return;

    // injeta redirect nos links (sempre funciona, mesmo sem JS extra)
    const redirect = encodeURIComponent(location.pathname + location.search);
    const aSignup = document.getElementById('go-signup');
    const aLogin  = document.getElementById('go-login');
    if (aSignup) aSignup.href = `cadastro.html?mode=signup&redirect=${redirect}`;
    if (aLogin)  aLogin.href  = `cadastro.html?mode=login&redirect=${redirect}`;

    function blur(on){
      ['header','main','footer','#tts-mini','.enabled[vw]'].forEach(sel=>{
        const el = document.querySelector(sel);
        if (el) el.classList.toggle('is-blurred', on);
      });
      document.body.classList.toggle('modal-open', on);
    }
    function lock(){ blur(true); gate.hidden = false; }
    function unlock(){ blur(false); gate.hidden = true; }

    if (Auth.in()) unlock(); else lock();

    // Acessibilidade básica no gate
    gate.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape'){ window.location.href = 'index.html'; }
    });
  }

  // Inicialização em TODA página:
  ensureBadge();
  renderAuthBadge();
  setupGate();

  // Se mudar storage em outra aba, reflete:
  window.addEventListener('storage', (e)=>{
    if (e.key === 'ap_auth' || e.key === 'ap_user'){
      renderAuthBadge();
      // Em compra.html, reavalia o gate
      if (document.getElementById('auth-gate')) {
        // simples: recarrega para reavaliar
        location.reload();
      }
    }
  });
})();

// Mostrar/ocultar senha (botões 👁️)
(function(){
  const btns = document.querySelectorAll('[data-toggle="password"]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-target');
      const input = document.getElementById(id);
      if (!input) return;
      const toText = input.type === 'password';
      input.type = toText ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(toText));
      btn.textContent = toText ? '🙈' : '👁️';
    });
  });
})();
