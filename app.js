(function () {
  'use strict';

  const API_KEY_STORAGE = 'spanish_app_openai_key';
  const SYSTEM_PROMPT = `You are a Spanish conversation partner and language tutor.

1. LANGUAGE USE:
   - If the user writes or speaks in SPANISH: reply in Spanish. Correct any errors gently using this format in your first paragraph when needed: [CORRECCIÓN: <corrected version of their phrase>]. Then continue the conversation naturally.
   - If the user writes or speaks in ENGLISH to ask about the language (e.g. "How do I say X?", "What's the difference between ser and estar?", "Why is it subjunctive here?"): answer in English with clear explanations and Spanish examples. Keep answers concise (2–5 sentences) so they are easy to hear when read aloud.

2. PRONUNCIATION / MISHEARINGS: If what they said in Spanish looks like it could be a mishearing or pronunciation issue (e.g. wrong word that sounds similar), gently give the correct form and optionally say how to pronounce it. Use [CORRECCIÓN: ...] for the correct phrase.

3. Keep replies concise (2–4 sentences) so they work well when read aloud. Vary topics when chatting in Spanish: day, plans, preferences, news, etc.`;

  const messagesEl = document.getElementById('messages');
  const userInput = document.getElementById('userInput');
  const micBtn = document.getElementById('micBtn');
  const sendBtn = document.getElementById('sendBtn');
  const statusEl = document.getElementById('status');
  const apiKeyBtn = document.getElementById('apiKeyBtn');
  const apiModal = document.getElementById('apiModal');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiCancel = document.getElementById('apiCancel');
  const apiSave = document.getElementById('apiSave');

  let conversationHistory = [];
  let synth = null;
  let spanishVoice = null;
  let recognition = null;
  let isListening = false;
  let lastTranscript = '';
  let voiceSessionStart = '';

  function setStatus(text) {
    statusEl.textContent = text || '';
  }

  function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'es-ES';
    rec.onresult = function (e) {
      const last = e.results.length - 1;
      const text = (e.results[last][0].transcript || '').trim();
      lastTranscript = text;
      const base = voiceSessionStart.trim();
      const newContent = base ? base + ' ' + text : text;
      userInput.value = newContent;
      if (e.results[last].isFinal) {
        setStatus('');
        stopListening();
      } else {
        setStatus('Escuchando: ' + text + '…');
      }
    };
    rec.onend = function () {
      if (isListening) stopListening();
      if (lastTranscript.trim()) {
        const base = voiceSessionStart.trim();
        userInput.value = base ? base + ' ' + lastTranscript : lastTranscript;
      }
    };
    rec.onerror = function (e) {
      setStatus('Error de voz: ' + (e.error || 'desconocido'));
      stopListening();
    };
    return rec;
  }

  function startListening() {
    if (!recognition) {
      recognition = initSpeechRecognition();
    }
    if (!recognition) {
      setStatus('Tu navegador no soporta voz. Escribe en el cuadro.');
      return;
    }
    isListening = true;
    lastTranscript = '';
    voiceSessionStart = (userInput.value || '').trim();
    micBtn.classList.add('listening');
    micBtn.setAttribute('aria-label', 'Parar');
    setStatus('Habla ahora…');
    try {
      recognition.start();
    } catch (err) {
      setStatus('No se pudo iniciar el micrófono.');
      stopListening();
    }
  }

  function stopListening() {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.setAttribute('aria-label', 'Hablar');
    if (recognition) try { recognition.stop(); } catch (_) {}
  }

  function initTTS() {
    synth = window.speechSynthesis;
    function pickVoice() {
      const voices = synth.getVoices();
      const prefer = voices.filter(v => v.lang.startsWith('es'));
      spanishVoice = prefer.find(v => v.name.includes('Spain') || v.name.includes('España'))
        || prefer.find(v => v.lang === 'es-ES')
        || prefer[0]
        || voices.find(v => v.lang.startsWith('es'));
    }
    pickVoice();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = pickVoice;
    }
  }

  function speak(text) {
    if (!synth || !text.trim()) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 1;
    if (spanishVoice) u.voice = spanishVoice;
    u.lang = 'es-ES';
    synth.speak(u);
  }

  function parseCorrection(reply) {
    const match = reply.match(/\s*\[CORRECCIÓN:\s*([^\]]+)\]\s*/i);
    if (!match) return { correction: null, cleanReply: reply.trim() };
    const correction = match[1].trim();
    const cleanReply = reply.replace(/\s*\[CORRECCIÓN:\s*[^\]]+\]\s*/gi, '').trim();
    return { correction, cleanReply };
  }

  function addMessage(role, text, correction) {
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    let html = escapeHtml(text);
    if (role === 'you' && correction) {
      html += '<div class="correction"><strong>Corregido:</strong> ' + escapeHtml(correction) + '</div>';
    }
    if (role === 'bot' && text) {
      html += ' <button type="button" class="speak-again" title="Escuchar de nuevo" aria-label="Escuchar de nuevo">🔊</button>';
    }
    div.innerHTML = html;
    messagesEl.appendChild(div);
    if (role === 'bot') {
      var btn = div.querySelector('.speak-again');
      if (btn) btn.addEventListener('click', function () { speak(text); });
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendCorrectionToLastYouMessage(correction) {
    const lastYou = messagesEl.querySelector('.msg.you:last-child');
    if (!lastYou || !correction) return;
    const box = document.createElement('div');
    box.className = 'correction';
    box.innerHTML = '<strong>Corregido:</strong> ' + escapeHtml(correction);
    lastYou.appendChild(box);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(s) {
    const el = document.createElement('div');
    el.textContent = s;
    return el.innerHTML;
  }

  function showError(msg) {
    const div = document.createElement('div');
    div.className = 'msg bot error-msg';
    div.style.background = 'rgba(239, 68, 68, 0.15)';
    div.style.borderColor = '#ef4444';
    div.textContent = 'Error: ' + msg;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendToOpenAI(userText) {
    const key = getApiKey();
    if (!key) {
      apiModal.classList.remove('hidden');
      setStatus('Añade tu API key de OpenAI.');
      return null;
    }

    conversationHistory.push({ role: 'user', content: userText });
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-14).map(m => ({ role: m.role, content: m.content }))
    ];

    let res;
    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, 25000);
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 300,
          temperature: 0.7
        })
      });
    } catch (err) {
      clearTimeout(timeoutId);
      conversationHistory.pop();
      var errMsg = err.message || String(err);
      setStatus('');
      if (err.name === 'AbortError') {
        showError('Tiempo de espera. Usa Safari si estás en DuckDuckGo u otro navegador.');
      } else {
        showError('No se pudo conectar. ' + errMsg);
      }
      return null;
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
      var errText = '';
      try { errText = await res.text(); } catch (_) {}
      conversationHistory.pop();
      setStatus('');
      showError('API ' + res.status + ': ' + (errText.slice(0, 120) || res.statusText));
      return null;
    }

    var data;
    try {
      data = await res.json();
    } catch (_) {
      conversationHistory.pop();
      setStatus('');
      showError('Respuesta inválida de la API.');
      return null;
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      conversationHistory.pop();
      setStatus('');
      showError('La API no devolvió texto. Revisa tu cuenta OpenAI.');
      return null;
    }

    conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  }

  async function handleSend() {
    const text = (userInput.value || '').trim();
    if (!text) return;

    userInput.value = '';
    addMessage('you', text);
    sendBtn.disabled = true;
    setStatus('Pensando…');

    try {
      const reply = await sendToOpenAI(text);
      if (!reply) return;

      const { correction, cleanReply } = parseCorrection(reply);
      if (correction) appendCorrectionToLastYouMessage(correction);
      addMessage('bot', cleanReply, null);
      speak(cleanReply);
    } catch (err) {
      showError((err.message || String(err)).slice(0, 200));
    } finally {
      sendBtn.disabled = false;
      setStatus('');
    }
  }

  function openApiModal() {
    apiKeyInput.value = getApiKey();
    apiModal.classList.remove('hidden');
    apiKeyInput.focus();
  }

  function closeApiModal() {
    apiModal.classList.add('hidden');
  }

  function saveApiKey() {
    const key = (apiKeyInput.value || '').trim();
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    closeApiModal();
  }

  function toggleMic() {
    if (isListening) stopListening();
    else startListening();
  }

  function addTap(el, fn) {
    if (!el) return;
    var last = 0;
    function run(e) {
      e.preventDefault();
      e.stopPropagation();
      var now = Date.now();
      if (now - last < 400) return;
      last = now;
      fn(e);
    }
    el.addEventListener('pointerup', run, { passive: false });
    el.addEventListener('click', run, { passive: false });
  }

  addTap(micBtn, toggleMic);

  addTap(sendBtn, handleSend);

  userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  addTap(apiKeyBtn, openApiModal);
  addTap(apiCancel, closeApiModal);
  addTap(apiSave, saveApiKey);

  window.openApiModal = openApiModal;
  window.closeApiModal = closeApiModal;
  window.saveApiKey = saveApiKey;
  window.toggleMic = toggleMic;

  (function checkApiKey() {
    var params = new URLSearchParams(window.location.search);
    var keyFromUrl = params.get('key') || params.get('api_key');
    if (keyFromUrl) {
      localStorage.setItem(API_KEY_STORAGE, keyFromUrl.trim());
      window.history.replaceState({}, '', window.location.pathname || '/');
    }
    if (!getApiKey()) {
      setTimeout(openApiModal, 500);
    }
  })();

  initTTS();
})();
