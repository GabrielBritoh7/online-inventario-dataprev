(() => {
  'use strict';

  // ==========================================
  // CONFIGURAÇÃO DO BANCO EM NUVEM (SUPABASE)
  // Cole aqui a URL e a Anon Key do seu projeto Supabase:
  // ==========================================
  const SUPABASE_URL = 'https://aaqnldnahmepcpwzvamn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5sZG5haG1lcGNwd3p2YW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDk1NDYsImV4cCI6MjEwNTgyNTU0Nn0.L6uSzYl5L-jHGhVoQXIK7MdfFpULyr1Uo4u_WzAkrPg';

  const cleanSupabaseUrl = SUPABASE_URL.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const isSupabaseConfigured = Boolean(window.supabase && cleanSupabaseUrl && SUPABASE_ANON_KEY);
  const supabase = isSupabaseConfigured ? window.supabase.createClient(cleanSupabaseUrl, SUPABASE_ANON_KEY.trim()) : null;

  const STORAGE_KEY = 'inventario-ti-registros-v1';
  const form = document.querySelector('#inventoryForm');
  const recordList = document.querySelector('#recordList');
  const emptyState = document.querySelector('#emptyState');
  const searchInput = document.querySelector('#searchInput');
  const toast = document.querySelector('#toast');
  const scannerDialog = document.querySelector('#scannerDialog');
  const scannerVideo = document.querySelector('#scannerVideo');
  const scannerMessage = document.querySelector('#scannerMessage');
  let scanTarget = null;
  let cameraStream = null;
  let scanFrame = null;
  let installPrompt = null;

  let inMemoryRecords = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  })();

  const readRecords = () => inMemoryRecords;

  const writeLocalRecords = (records, shouldRefresh = true) => {
    inMemoryRecords = records;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch {}
    if (shouldRefresh) refresh();
  };

  const writeRecords = (records) => {
    writeLocalRecords(records, true);
  };

  const clean = (value) => String(value ?? '').trim();
  const normalized = (value) => clean(value).toLocaleLowerCase('pt-BR');
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const formatAssetTag = (value) => {
    const raw = clean(value);
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 8) {
      return digits.slice(-6);
    }
    if (digits.length === 6) {
      return digits;
    }
    return raw;
  };

  const toSupabaseRecord = (record) => ({
    id: record.id,
    asset_tag: record.assetTag,
    serial_number: record.serialNumber,
    brand: record.brand,
    model: record.model,
    state: record.state,
    status: record.status,
    components: record.components || [],
    notes: record.notes || '',
    updated_at: record.updatedAt || new Date().toISOString()
  });

  const fromSupabaseRecord = (item) => ({
    id: item.id,
    assetTag: item.asset_tag,
    serialNumber: item.serial_number,
    brand: item.brand,
    model: item.model,
    state: item.state,
    status: item.status,
    components: Array.isArray(item.components) ? item.components : [],
    notes: item.notes || '',
    updatedAt: item.updated_at
  });

  function updateConnectionStatus(isOnline = isSupabaseConfigured) {
    const syncStatus = document.querySelector('#syncStatus');
    const dataNote = document.querySelector('#dataNote');
    if (isOnline) {
      if (syncStatus) syncStatus.textContent = '● NUVEM CONECTADA';
      if (dataNote) {
        dataNote.innerHTML = '<strong>Banco compartilhado em nuvem ativo.</strong><span>Todos os aparelhos e computadores sincronizam em tempo real.</span>';
      }
    } else {
      if (syncStatus) syncStatus.textContent = 'CONTROLE LOCAL';
      if (dataNote) {
        dataNote.innerHTML = '<strong>Seus dados ficam neste navegador.</strong><span>Configure o Supabase no app.js para compartilhar a base entre todos os aparelhos.</span>';
      }
    }
  }

  async function fetchFromSupabase() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar do Supabase:', error);
        showToast('Nuvem: ' + error.message);
        return;
      }
      if (Array.isArray(data)) {
        writeLocalRecords(data.map(fromSupabaseRecord));
        updateConnectionStatus(true);
      }
    } catch (err) {
      console.warn('Não foi possível sincronizar com o Supabase:', err);
      showToast('Erro ao sincronizar: ' + (err.message || err));
    }
  }

  function setupRealtime() {
    if (!supabase) return;
    try {
      supabase
        .channel('inventario-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => {
          fetchFromSupabase();
        })
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar ao Realtime do Supabase:', err);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function switchView(id) {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === id));
    document.querySelectorAll('.view').forEach((view) => {
      const active = view.id === id;
      view.classList.toggle('active', active);
      view.hidden = !active;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateSummary(records) {
    document.querySelector('#totalCount').textContent = records.length;
    document.querySelector('#okCount').textContent = records.filter((r) => r.state === 'OK').length;
    document.querySelector('#faultCount').textContent = records.filter((r) => r.state === 'Defeito').length;
    document.querySelector('#tabCount').textContent = records.length;
  }

  function renderRecords(records) {
    const query = normalized(searchInput.value);
    const filtered = records.filter((record) => [record.assetTag, record.serialNumber, record.brand, record.model]
      .some((value) => normalized(value).includes(query)));

    emptyState.hidden = filtered.length > 0;
    if (!records.length) {
      emptyState.querySelector('strong').textContent = 'Nenhum computador registrado';
      emptyState.querySelector('p').textContent = 'Cadastre o primeiro equipamento para começar o inventário.';
    } else if (!filtered.length) {
      emptyState.querySelector('strong').textContent = 'Nenhum resultado';
      emptyState.querySelector('p').textContent = 'Tente pesquisar por outro patrimônio, série, marca ou modelo.';
    }

    recordList.innerHTML = filtered.map((record) => `
      <article class="record-card">
        <div class="record-top">
          <div>
            <h3>${escapeHtml(record.brand)} ${escapeHtml(record.model)}</h3>
            <p>Patrimônio ${escapeHtml(record.assetTag)} · Série ${escapeHtml(record.serialNumber)}</p>
          </div>
          <div class="record-actions">
            <button type="button" data-edit="${escapeHtml(record.id)}">Editar</button>
            <button type="button" class="delete" data-delete="${escapeHtml(record.id)}">Excluir</button>
          </div>
        </div>
        <div class="record-meta">
          <span class="pill ${record.state === 'OK' ? 'ok' : 'fault'}">${escapeHtml(record.state)}</span>
          <span class="pill">${escapeHtml(record.status)}</span>
          <span class="pill">${escapeHtml(new Date(record.updatedAt).toLocaleString('pt-BR'))}</span>
        </div>
      </article>`).join('');
  }

  function refresh() {
    const records = readRecords();
    updateSummary(records);
    renderRecords(records);
  }

  function getFormRecord() {
    const data = new FormData(form);
    return {
      id: clean(data.get('recordId')) || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      assetTag: formatAssetTag(data.get('assetTag')),
      serialNumber: clean(data.get('serialNumber')),
      brand: clean(data.get('brand')),
      model: clean(data.get('model')),
      state: clean(data.get('state')),
      status: clean(data.get('status')),
      components: data.getAll('components').map(clean),
      notes: clean(data.get('notes')),
      updatedAt: new Date().toISOString()
    };
  }

  function duplicateOf(candidate, records) {
    return records.find((record) => record.id !== candidate.id && (
      normalized(record.assetTag) === normalized(candidate.assetTag) ||
      normalized(record.serialNumber) === normalized(candidate.serialNumber)
    ));
  }

  function resetForm() {
    form.reset();
    document.querySelector('#recordId').value = '';
    document.querySelector('#formEyebrow').textContent = 'CADASTRO';
    document.querySelector('#formTitle').textContent = 'Novo computador';
    document.querySelector('#saveButton').textContent = 'Salvar computador';
    document.querySelector('#cancelEdit').hidden = true;
    document.querySelector('#duplicateWarning').hidden = true;
  }

  function editRecord(id) {
    const record = readRecords().find((item) => item.id === id);
    if (!record) return;
    resetForm();
    ['id', 'assetTag', 'serialNumber', 'brand', 'model', 'notes'].forEach((key) => {
      const element = document.querySelector(`#${key === 'id' ? 'recordId' : key}`);
      if (element) element.value = record[key] || '';
    });
    form.querySelector(`[name="state"][value="${CSS.escape(record.state)}"]`).checked = true;
    form.querySelector(`[name="status"][value="${CSS.escape(record.status)}"]`).checked = true;
    form.querySelectorAll('[name="components"]').forEach((input) => { input.checked = record.components.includes(input.value); });
    document.querySelector('#formEyebrow').textContent = 'EDIÇÃO';
    document.querySelector('#formTitle').textContent = 'Editar computador';
    document.querySelector('#saveButton').textContent = 'Salvar alterações';
    document.querySelector('#cancelEdit').hidden = false;
    switchView('formView');
  }

  async function deleteRecord(id) {
    const record = readRecords().find((item) => item.id === id);
    if (!record || !window.confirm(`Excluir o patrimônio ${record.assetTag}?`)) return;
    const updated = readRecords().filter((item) => item.id !== id);
    writeRecords(updated);
    showToast('Registro excluído.');

    if (supabase) {
      try {
        const { error } = await supabase.from('inventario').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Erro ao excluir no Supabase:', err);
      }
    }
  }

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const records = readRecords();
    if (!records.length) return showToast('Cadastre ao menos um computador antes de exportar.');
    const headers = ['ID', 'Patrimônio', 'Número de série', 'Marca', 'Modelo', 'Estado', 'Situação', 'Componentes', 'Observações / laudo', 'Última atualização'];
    const rows = records.map((r) => [r.id, r.assetTag, r.serialNumber, r.brand, r.model, r.state, r.status, r.components.join(', '), r.notes, new Date(r.updatedAt).toLocaleString('pt-BR')]);
    const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `estoque_computadores_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Planilha exportada.');
  }

  async function closeScanner() {
    if (scanFrame) cancelAnimationFrame(scanFrame);
    scanFrame = null;
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    scannerVideo.srcObject = null;
    scannerDialog.hidden = true;
  }

  async function openScanner(targetId) {
    scanTarget = document.querySelector(`#${targetId}`);
    scannerDialog.hidden = false;
    scannerMessage.textContent = 'Aponte a câmera para o código de barras.';
    if (!('BarcodeDetector' in window)) {
      scannerMessage.textContent = 'Este navegador não oferece leitura automática. Use a digitação manual.';
      return;
    }
    try {
      const detector = new BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'itf', 'codabar', 'qr_code'] });
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      scannerVideo.srcObject = cameraStream;
      await scannerVideo.play();
      const scan = async () => {
        if (!cameraStream) return;
        try {
          const codes = await detector.detect(scannerVideo);
          if (codes.length) {
            let scannedValue = codes[0].rawValue;
            if (scanTarget?.id === 'assetTag') {
              scannedValue = formatAssetTag(scannedValue);
            }
            scanTarget.value = scannedValue;
            scanTarget.dispatchEvent(new Event('input', { bubbles: true }));
            scanTarget.dispatchEvent(new Event('change', { bubbles: true }));
            await closeScanner();
            scanTarget.focus();
            showToast('Código lido com sucesso.');
            return;
          }
        } catch { /* continue scanning */ }
        scanFrame = requestAnimationFrame(scan);
      };
      scan();
    } catch {
      scannerMessage.textContent = 'Não foi possível abrir a câmera. Verifique a permissão ou digite manualmente.';
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const records = readRecords();
    const candidate = getFormRecord();
    const duplicate = duplicateOf(candidate, records);
    const warning = document.querySelector('#duplicateWarning');
    if (duplicate) {
      warning.textContent = `Este computador já está cadastrado (patrimônio ${duplicate.assetTag}, série ${duplicate.serialNumber}).`;
      warning.hidden = false;
      return;
    }
    const index = records.findIndex((record) => record.id === candidate.id);
    if (index >= 0) records[index] = candidate; else records.unshift(candidate);
    writeRecords(records);
    resetForm();
    showToast(index >= 0 ? 'Alterações salvas.' : 'Computador salvo com sucesso.');

    if (supabase) {
      try {
        const { error } = await supabase.from('inventario').upsert(toSupabaseRecord(candidate));
        if (error) {
          console.error('Erro ao sincronizar com o Supabase:', error);
          alert('Atenção: Não gravou na nuvem!\n\nMotivo: ' + error.message + '\n\nDetalhes: ' + (error.details || error.hint || 'Verifique o RLS ou o nome da tabela.'));
        }
      } catch (err) {
        console.error('Erro ao sincronizar com o Supabase:', err);
        alert('Erro de conexão com o Supabase: ' + (err.message || err));
      }
    }
  });

  const assetTagInput = document.querySelector('#assetTag');
  if (assetTagInput) {
    assetTagInput.addEventListener('change', () => {
      assetTagInput.value = formatAssetTag(assetTagInput.value);
    });
  }

  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => switchView(tab.dataset.view)));
  document.querySelectorAll('[data-scan-target]').forEach((button) => button.addEventListener('click', () => openScanner(button.dataset.scanTarget)));
  document.querySelector('#closeScanner').addEventListener('click', closeScanner);
  document.querySelector('#manualEntry').addEventListener('click', async () => { await closeScanner(); scanTarget?.focus(); });
  document.querySelector('#cancelEdit').addEventListener('click', resetForm);
  document.querySelector('#exportCsv').addEventListener('click', exportCsv);
  searchInput.addEventListener('input', refresh);
  recordList.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit]');
    const remove = event.target.closest('[data-delete]');
    if (edit) editRecord(edit.dataset.edit);
    if (remove) deleteRecord(remove.dataset.delete);
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); installPrompt = event; document.querySelector('#installButton').hidden = false;
  });
  document.querySelector('#installButton').addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt(); installPrompt = null; document.querySelector('#installButton').hidden = true;
  });

  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));

  const modelContext = document.modelContext;
  if (modelContext?.registerTool) {
    const schema = { type: 'object', properties: {}, additionalProperties: false };
    Promise.resolve(modelContext.registerTool({
      name: 'list_inventory_records', title: 'Listar inventário',
      description: 'Lista os computadores armazenados neste navegador.', inputSchema: schema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => ({ count: readRecords().length, records: readRecords() })
    })).catch(() => {});
  }

  updateConnectionStatus();
  refresh();
  if (supabase) {
    fetchFromSupabase();
    setupRealtime();
  }
})();
