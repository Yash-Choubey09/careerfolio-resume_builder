(() => {
  const form = document.getElementById('resume-form');
  if (!form) return;

  const status = document.getElementById('save-status');
  const toast = document.getElementById('toast');
  const preview = document.getElementById('resume-preview');
  const context = document.querySelector('link[href*="/assets/styles.css"]').getAttribute('href').replace(/\/assets\/styles\.css(?:\?.*)?$/, '');
  const templateNames = { modern: 'The Modernist', executive: 'The Executive', minimal: 'The Essential', creative: 'The Creative', graduate: 'The Graduate', classic: 'The Classic', tech: 'The Technical', academic: 'The Academic' };
  const requestedTemplate = new URLSearchParams(window.location.search).get('template');
  const routeTemplate = Object.prototype.hasOwnProperty.call(templateNames, requestedTemplate) ? requestedTemplate : null;
  const accents = { cobalt: '#243cff', plum: '#8150a0', forest: '#2f795e', terracotta: '#a34f3b' };
  const repeated = new Set(['experienceTitle', 'experienceCompany', 'experienceDates', 'experienceLocation', 'experienceDescription', 'educationDegree', 'educationSchool', 'educationYear']);
  let saveTimer;
  let localWriteOk = true;

  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const current = name => String(new FormData(form).get(name) || '').trim();
  const collect = () => {
    const draft = {};
    new FormData(form).forEach((value, key) => {
      if (Object.prototype.hasOwnProperty.call(draft, key)) {
        if (!Array.isArray(draft[key])) draft[key] = [draft[key]];
        draft[key].push(value);
      } else draft[key] = value;
    });
    return draft;
  };
  const saveLocal = draft => {
    try { localStorage.setItem('careerfolio-draft', JSON.stringify(draft)); localWriteOk = true; }
    catch (_) { localWriteOk = false; }
  };
  const saveServer = async draft => {
    const data = new URLSearchParams();
    Object.entries(draft).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).forEach(item => data.append(key, item)));
    const response = await fetch(`${context}/api/resume`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/xml' }, body: data });
    if (!response.ok) throw new Error('Resume save failed');
  };
  const persistNow = async () => {
    const draft = collect();
    saveLocal(draft);
    status.textContent = 'Saving…';
    try { await saveServer(draft); status.textContent = 'All changes saved'; return true; }
    catch (_) { status.textContent = localWriteOk ? 'Saved on this device' : 'Could not save — check your connection'; return false; }
  };
  const save = () => {
    clearTimeout(saveTimer);
    status.textContent = 'Saving…';
    saveTimer = setTimeout(persistNow, 450);
  };

  const renderTemplate = id => {
    if (!Object.prototype.hasOwnProperty.call(templateNames, id)) id = 'modern';
    [...preview.classList].filter(name => name.startsWith('paper--')).forEach(name => preview.classList.remove(name));
    preview.classList.add(`paper--${id}`);
    form.elements.namedItem('template').value = id;
    document.getElementById('template-choice').value = id;
    document.getElementById('template-title').textContent = templateNames[id];
    document.title = `${templateNames[id]} · Careerfolio Resume Studio`;
  };
  const renderAccent = id => {
    const accent = accents[id] ? id : 'cobalt';
    form.elements.namedItem('accentColor').value = accent;
    document.documentElement.style.setProperty('--template-accent', accents[accent]);
  };
  const updateText = (key, fallback) => {
    document.querySelectorAll(`[data-out="${key}"]`).forEach(node => {
      const value = current(key);
      node.textContent = value || fallback;
      node.classList.toggle('paper-empty', !value);
    });
  };
  const valuesIn = (container, selector) => [...container.querySelectorAll(selector)].map(input => [input.name, input.value.trim()]);
  const render = () => {
    updateText('fullName', 'Your Name');
    updateText('jobTitle', 'Professional title');
    updateText('email', 'Email address');
    updateText('phone', 'Phone number');
    updateText('location', 'Location');
    updateText('website', '');
    updateText('summary', 'Your professional summary will appear here.');
    updateText('skills', 'Your skills will appear here.');
    document.getElementById('preview-monogram').textContent = (current('fullName') || 'Y').charAt(0).toUpperCase();

    const experienceTarget = document.getElementById('preview-experience-list');
    experienceTarget.replaceChildren();
    const experience = [...document.querySelectorAll('#experience-list .experience-card')].map(card => Object.fromEntries(valuesIn(card, '[name]'))).filter(entry => Object.values(entry).some(Boolean));
    if (!experience.length) {
      const empty = document.createElement('p'); empty.className = 'paper-empty'; empty.textContent = 'Add a role to show your experience.'; experienceTarget.appendChild(empty);
    } else experience.forEach(entry => {
      const block = document.createElement('div'); block.className = 'paper-experience';
      block.innerHTML = `<div class="paper-entry-head"><strong>${esc(entry.experienceTitle || 'Position')}</strong><span>${esc(entry.experienceDates)}</span></div><div class="paper-entry-sub">${esc([entry.experienceCompany, entry.experienceLocation].filter(Boolean).join(' · '))}</div><p>${esc(entry.experienceDescription)}</p>`;
      experienceTarget.appendChild(block);
    });

    const educationTarget = document.getElementById('preview-education-list');
    educationTarget.replaceChildren();
    const education = [...document.querySelectorAll('#education-list .education-card')].map(card => Object.fromEntries(valuesIn(card, '[name]'))).filter(entry => Object.values(entry).some(Boolean));
    if (!education.length) {
      const empty = document.createElement('p'); empty.className = 'paper-empty'; empty.textContent = 'Add your education.'; educationTarget.appendChild(empty);
    } else education.forEach(entry => {
      const block = document.createElement('div'); block.className = 'paper-education';
      block.innerHTML = `<div class="paper-entry-head"><strong>${esc(entry.educationDegree || 'Qualification')}</strong><span>${esc(entry.educationYear)}</span></div><div class="paper-entry-sub">${esc(entry.educationSchool)}</div>`;
      educationTarget.appendChild(block);
    });
  };

  const addEntry = (container, type, values = {}) => {
    const card = document.createElement('div');
    card.className = type === 'experience' ? 'experience-card' : 'education-card';
    if (type === 'experience') {
      card.innerHTML = `<div class="experience-header"><span class="experience-index"></span><button type="button" class="remove-entry" aria-label="Remove experience">×</button></div><div class="field-grid"><label class="field">Job title<input name="experienceTitle" placeholder="e.g. Senior Designer"></label><label class="field">Company<input name="experienceCompany" placeholder="Company name"></label><label class="field">Dates<input name="experienceDates" placeholder="2021 — Present"></label><label class="field">Location<input name="experienceLocation" placeholder="City, Country"></label><label class="field field-wide">Key contributions<textarea name="experienceDescription" rows="3" placeholder="Describe your impact and results."></textarea></label></div>`;
    } else {
      card.innerHTML = `<div class="field-grid"><label class="field">Degree or qualification<input name="educationDegree" placeholder="Degree / qualification"></label><label class="field">School<input name="educationSchool" placeholder="School name"></label><label class="field">Year<input name="educationYear" placeholder="Year"></label><button type="button" class="remove-entry" aria-label="Remove education">Remove education ×</button></div>`;
    }
    Object.entries(values).forEach(([key, value]) => { const input = card.querySelector(`[name="${key}"]`); if (input && typeof value === 'string') input.value = value; });
    card.querySelector('.remove-entry').addEventListener('click', () => { card.remove(); renumber(); render(); save(); });
    container.appendChild(card);
    renumber();
    return card;
  };
  const renumber = () => document.querySelectorAll('#experience-list .experience-card').forEach((card, index) => { card.querySelector('.experience-index').textContent = `EXPERIENCE ${String(index + 1).padStart(2, '0')}`; });

  const applyDraft = draft => {
    if (!draft) return;
    Object.entries(draft).forEach(([key, value]) => {
      if (repeated.has(key) || key === 'template' || key === 'accentColor') return;
      const field = form.elements.namedItem(key);
      if (field && typeof value === 'string') field.value = value;
    });
    if (!routeTemplate && typeof draft.template === 'string') renderTemplate(draft.template);
    if (typeof draft.accentColor === 'string') renderAccent(draft.accentColor);
    const restoreEntries = (keys, type) => {
      const source = keys.map(key => draft[key] ?? '');
      const count = Math.max(0, ...source.map(value => Array.isArray(value) ? value.length : (value ? 1 : 0)));
      for (let index = 0; index < count; index++) {
        const entry = {};
        keys.forEach((key, position) => { entry[key] = Array.isArray(source[position]) ? source[position][index] || '' : index === 0 ? source[position] : ''; });
        addEntry(document.getElementById(type === 'experience' ? 'experience-list' : 'education-list'), type, entry);
      }
    };
    restoreEntries(['experienceTitle', 'experienceCompany', 'experienceDates', 'experienceLocation', 'experienceDescription'], 'experience');
    restoreEntries(['educationDegree', 'educationSchool', 'educationYear'], 'education');
  };
  const readServerDraft = async () => {
    try {
      const response = await fetch(`${context}/api/resume`, { headers: { Accept: 'application/xml' }, cache: 'no-store' });
      if (!response.ok) return null;
      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
      if (xml.querySelector('parsererror')) return null;
      const draft = {};
      xml.querySelectorAll('resume > field[name]').forEach(field => {
        const key = field.getAttribute('name');
        if (!key) return;
        if (!Object.prototype.hasOwnProperty.call(draft, key)) draft[key] = field.textContent || '';
        else { if (!Array.isArray(draft[key])) draft[key] = [draft[key]]; draft[key].push(field.textContent || ''); }
      });
      return Object.keys(draft).length ? draft : null;
    } catch (_) { return null; }
  };
  const restore = async () => {
    try {
      const local = localStorage.getItem('careerfolio-draft');
      if (local) { const draft = JSON.parse(local); if (draft) { applyDraft(draft); if (routeTemplate) renderTemplate(routeTemplate); return; } }
    } catch (_) { /* Continue with the private Java session. */ }
    applyDraft(await readServerDraft());
    if (routeTemplate) renderTemplate(routeTemplate);
  };
  const printResume = async () => {
    if (!form.reportValidity()) return;
    clearTimeout(saveTimer);
    await persistNow();
    render();
    toast.textContent = 'Choose “Save as PDF” in the print window.';
    toast.classList.add('show');
    setTimeout(() => window.print(), 180);
    setTimeout(() => toast.classList.remove('show'), 2800);
  };
  const exportWord = async () => {
    if (!form.reportValidity()) return;
    clearTimeout(saveTimer);
    const saved = await persistNow();
    if (!saved) {
      toast.textContent = 'Connect to the resume service before downloading Word.';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
      return;
    }
    window.location.href = `${context}/api/resume?format=word`;
  };
  const authButton = document.getElementById('auth-button');
  const logoutButton = document.getElementById('logout-button');
  const auth = async action => {
    const email = window.prompt(`${action === 'register' ? 'Create account' : 'Sign in'} email`);
    if (!email) return false;
    const password = window.prompt('Password (minimum 8 characters)');
    if (!password) return false;
    const data = new URLSearchParams({ action, email, password });
    const response = await fetch(`${context}/api/auth`, { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Authentication failed');
    authButton.hidden = true; logoutButton.hidden = false; status.textContent = `Signed in as ${result.email}`;
    return true;
  };
  const checkAuth = async () => {
    const response = await fetch(`${context}/api/auth`, { cache: 'no-store' });
    const result = await response.json();
    authButton.textContent = result.authenticated ? 'Signed in' : 'Sign in / Register';
    authButton.hidden = result.authenticated; logoutButton.hidden = !result.authenticated;
    return result.authenticated;
  };
  const showError = error => { toast.textContent = error.message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200); };
  const generateLatex = async () => {
    if (!await checkAuth()) { showError(new Error('Sign in before generating editable LaTeX.')); return; }
    const response = await fetch(`${context}/api/resume?format=latex`, { cache: 'no-store' });
    if (!response.ok) { showError(new Error('Save your resume before generating LaTeX.')); return; }
    document.getElementById('latex-source').value = await response.text();
  };
  const runAts = async () => {
    if (!await checkAuth()) { showError(new Error('Sign in before running the ATS reader.')); return; }
    const draft = collect();
    const text = Object.values(draft).flat().join('\n');
    const response = await fetch(`${context}/api/ats`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams({ text }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'ATS analysis failed');
    document.getElementById('ats-result').innerHTML = `<strong>${esc(result.score)}/100</strong> · ${esc(result.message)}<br><small>Sections detected: ${esc(result.checks.sections)} · Contact: ${esc(result.checks.contact)} · Length: ${esc(result.checks.length)}</small>`;
  };

  const initialTemplate = [...preview.classList].find(name => name.startsWith('paper--'))?.replace('paper--', '') || 'modern';
  renderTemplate(initialTemplate);
  renderAccent('cobalt');
  document.getElementById('template-choice').addEventListener('change', event => { renderTemplate(event.target.value); render(); save(); });
  document.getElementById('accent-color').addEventListener('change', event => { renderAccent(event.target.value); save(); });
  form.addEventListener('input', () => { render(); save(); });
  form.addEventListener('change', () => { render(); save(); });
  form.addEventListener('submit', event => { event.preventDefault(); printResume(); });
  document.getElementById('add-experience').addEventListener('click', () => { addEntry(document.getElementById('experience-list'), 'experience').querySelector('input').focus(); });
  document.getElementById('add-education').addEventListener('click', () => { addEntry(document.getElementById('education-list'), 'education').querySelector('input').focus(); });
  ['download-pdf', 'download-bottom', 'preview-print'].forEach(id => document.getElementById(id).addEventListener('click', printResume));
  document.getElementById('download-word').addEventListener('click', exportWord);
  authButton.addEventListener('click', async () => { try { await auth(window.confirm('Choose OK to create a new account, or Cancel to sign in.') ? 'register' : 'login'); } catch (error) { showError(error); } });
  logoutButton.addEventListener('click', async () => { await fetch(`${context}/api/auth`, { method: 'POST', body: new URLSearchParams({ action: 'logout' }) }); logoutButton.hidden = true; authButton.hidden = false; status.textContent = 'Saved on this device'; });
  document.getElementById('generate-latex').addEventListener('click', generateLatex);
  document.getElementById('download-latex').addEventListener('click', async () => { await generateLatex(); const source = document.getElementById('latex-source').value; if (source) { const blob = new Blob([source], { type: 'application/x-tex' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Careerfolio-Resume.tex'; link.click(); URL.revokeObjectURL(link.href); } });
  document.getElementById('run-ats').addEventListener('click', () => runAts().catch(showError));

  status.textContent = 'Loading your workspace…';
  restore().finally(() => { render(); checkAuth().catch(() => false); status.textContent = 'All changes saved'; });
})();
