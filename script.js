// script.js — Acess Path (carrossel + formulários + VLibras + botão de voz mini robusto)
// --------------------------------------------------------------------------------------

(function () {
  // =============================
  // Utilitário: região de status
  // =============================
  const srStatus = document.getElementById('sr-status');
  function announce(msg) {
    if (!srStatus) return;
    srStatus.textContent = '';
    setTimeout(() => (srStatus.textContent = msg), 10);
  }

  // =============================
  // Carrossel com fade
  // =============================
  const carousel = document.querySelector('.carousel-fade');
  if (carousel) {
    const slides = carousel.querySelectorAll('.slide');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    const dots = carousel.querySelectorAll('.dot');
    let current = 0;
    let autoplayId = null;

    function showSlide(index) {
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
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
      dot.addEventListener('click', () => showSlide(parseInt(dot.dataset.index || '0', 10)));
      dot.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); showSlide(parseInt(dot.dataset.index || '0', 10)); }
      });
    });

    carousel.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); next(); }
      if (ev.key === 'ArrowLeft')  { ev.preventDefault(); prev(); }
    });

    function startAutoplay() { stopAutoplay(); autoplayId = setInterval(next, 5000); }
    function stopAutoplay()  { if (autoplayId) clearInterval(autoplayId); autoplayId = null; }

    [prevBtn, nextBtn, ...dots].forEach((el) => {
      el?.addEventListener('focus', stopAutoplay);
      el?.addEventListener('mouseover', stopAutoplay);
      el?.addEventListener('blur', startAutoplay);
      el?.addEventListener('mouseout', startAutoplay);
    });

    showSlide(0);
    startAutoplay();
  }

  // =============================
  // FORMULÁRIOS (se existirem)
  // =============================
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome')?.value || '';
      const email = document.getElementById('email')?.value || '';
      alert(`Bem-vindo(a), ${nome}! 🎉\nSeu cadastro com o e-mail ${email} foi realizado com sucesso.`);
      formCadastro.reset();
      announce('Cadastro enviado com sucesso.');
    });
  }

  const formCompra = document.getElementById('form-compra');
  if (formCompra) {
    formCompra.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome')?.value || '';
      const quantidade = document.getElementById('quantidade')?.value || '';
      const pagamento = document.getElementById('pagamento')?.value || '';
      alert(`Obrigado, ${nome}! 🎉\nSua compra de ${quantidade} unidade(s) foi registrada com pagamento via ${String(pagamento).toUpperCase()}.\nVocê receberá um e-mail com os detalhes.`);
      formCompra.reset();
      announce('Compra enviada com sucesso.');
    });
  }

  const formContato = document.getElementById('form-contato');
  if (formContato) {
    formContato.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome')?.value || '';
      const assunto = document.getElementById('assunto')?.value || '';
      alert(`Obrigado pela sua mensagem, ${nome}! 📩\nAssunto: ${String(assunto).toUpperCase()}\nNossa equipe entrará em contato em breve.`);
      formContato.reset();
      announce('Mensagem enviada com sucesso.');
    });
  }

  // ==========================================
  // VLibras + Botão de voz mini (robusto)
  // ==========================================
  // 1) Garante elementos no DOM
  function ensureElement(selector, creator) {
    let el = document.querySelector(selector);
    if (!el) {
      el = creator();
      document.body.appendChild(el);
      console.log('[AcessPath] criado:', selector);
    }
    return el;
  }

  const btn = ensureElement('#tts-mini', () => {
    const b = document.createElement('button');
    b.id = 'tts-mini';
    b.type = 'button';
    b.setAttribute('title', 'Leitor de voz');
    b.setAttribute('aria-label', 'Leitor de voz');
    b.setAttribute('aria-pressed', 'false');
    b.textContent = '🔊';
    return b;
  });

  const toastEl = ensureElement('#tts-toast', () => {
    const d = document.createElement('div');
    d.id = 'tts-toast';
    d.setAttribute('role', 'status');
    d.setAttribute('aria-live', 'polite');
    return d;
  });

  // Container VLibras
  const vlibContainer = ensureElement('[vw].enabled', () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('vw', '');
    wrapper.className = 'enabled';
    wrapper.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>`;
    return wrapper;
  });

  // 2) Garante carregamento do script VLibras
  function loadVLibrasScriptIfNeeded() {
    if (document.querySelector('script[src*="vlibras-plugin.js"]')) return Promise.resolve('already');
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      s.async = true;
      s.onload = () => resolve('loaded');
      s.onerror = () => reject(new Error('Falha ao carregar VLibras. Verifique conexão/HTTPS/CSP.'));
      document.head.appendChild(s);
    });
  }

  // 3) Inicializa VLibras
  function initVLibras() {
    try {
      if (window.VLibras && window.VLibras.Widget) {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
        console.log('[AcessPath] VLibras inicializado.');
      } else {
        console.warn('[AcessPath] VLibras ainda não disponível, tentando novamente...');
        setTimeout(initVLibras, 500);
      }
    } catch (e) {
      console.error('[AcessPath] Erro ao iniciar VLibras:', e);
    }
  }

  // 4) TTS helpers
  let currentUtterance = null;

  function toast(msg, ms = 1600){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  function getSelectedText(){
    const sel = window.getSelection && window.getSelection();
    return sel ? String(sel.toString() || '') : '';
  }

  function stopSpeak(){
    try{ window.speechSynthesis.cancel(); }catch(e){}
    btn.setAttribute('aria-pressed','false');
    btn.textContent = '🔊';
  }

  function speak(text){
    if (!('speechSynthesis' in window)) { toast('Seu navegador não suporta leitura de voz.'); return; }
    if (!text || !text.trim()) { toast('Selecione um texto ou clique em um parágrafo.'); return; }

    window.speechSynthesis.cancel();
    currentUtterance = new SpeechSynthesisUtterance(text.trim());
    currentUtterance.lang = 'pt-BR';
    currentUtterance.rate = 1;
    currentUtterance.pitch = 1;
    currentUtterance.onstart = () => { btn.setAttribute('aria-pressed','true'); btn.textContent = '⏹'; };
    currentUtterance.onend   = () => { btn.setAttribute('aria-pressed','false'); btn.textContent = '🔊'; };
    window.speechSynthesis.speak(currentUtterance);
  }

  // 5) Interação do botão mini
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.speechSynthesis.speaking) { stopSpeak(); return; }
    const selected = getSelectedText();
    if (selected.trim()) speak(selected); else toast('Selecione um texto ou clique em um parágrafo.');
  });

  // 6) Alinhamento automático com o botão do VLibras
  function syncWithVLibras(){
    const acc = document.querySelector('[vw-access-button]');
    if (!acc) return;
    const r = acc.getBoundingClientRect();
    const gap = 12;

    const rightOffset = window.innerWidth - r.right;
    btn.style.right = Math.max(12, rightOffset) + 'px';
    toastEl.style.right = btn.style.right;

    const vlibrasBottom = window.innerHeight - r.bottom;
    const ttsBottom = vlibrasBottom + r.height + gap;
    btn.style.bottom = ttsBottom + 'px';
    toastEl.style.bottom = (ttsBottom + 52) + 'px';
  }

  // 7) Observadores e retries
  function startSyncRetries() {
    // tenta várias vezes porque o VLibras injeta o botão com atraso
    const tries = [200, 600, 1200, 2000, 3000];
    tries.forEach(t => setTimeout(syncWithVLibras, t));
  }

  window.addEventListener('load', () => {
    syncWithVLibras();
    startSyncRetries();
  });
  window.addEventListener('resize', syncWithVLibras);

  const mo = new MutationObserver(syncWithVLibras);
  mo.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('beforeunload', () => stopSpeak());

  // 8) Boot: garante VLibras pronto (carrega e inicia)
  loadVLibrasScriptIfNeeded()
    .then(() => initVLibras())
    .catch((err) => {
      console.error('[AcessPath] VLibras não carregou:', err);
      toast('Não foi possível carregar o VLibras.');
    });

  console.log('[AcessPath] pronto. Se algo não funcionar, veja o console para detalhes.');
})();
