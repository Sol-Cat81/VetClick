/* admin/js/turnos_ui.js
   Solo UI/animaciones: modal, filtrado DOM, paginación visual y micro-feedback.
*/

(() => {
  // Config
  const rowsPerPage = 25;

  // Elementos
  const buscar = document.getElementById('buscarTurno');
  const filtroFecha = document.getElementById('filtroFecha');
  const filtroEstado = document.getElementById('filtroEstado');
  const tabla = document.getElementById('tablaTurnos');
  const filas = () => Array.from(tabla.querySelectorAll('tr'));
  const totalTurnosEl = document.getElementById('totalTurnos');
  const turnosRegistradosEl = document.getElementById('turnosRegistrados');
  const infoPagina = document.getElementById('infoPagina');
  const prevBtn = document.getElementById('paginaAnteriorTurno');
  const nextBtn = document.getElementById('paginaSiguienteTurno');

  // Modal
  const modal = document.getElementById('modalTurno');
  const btnAbrir = document.getElementById('btnAgregarTurno');
  const btnCerrar = document.getElementById('modalTurnoClose');
  const btnCancelar = document.getElementById('formCancelar');
  const formGuardar = document.getElementById('formGuardar');
  const modalTitle = document.getElementById('modalTurnoTitle');

  // Estado UI
  let currentPage = 1;
  let filtered = [];

  // Inicial
  document.addEventListener('DOMContentLoaded', () => {
    applyCounts();
    applyFilters();
    attachEvents();
  });

  function attachEvents(){
    buscar.addEventListener('input', debounce(applyFilters, 250));
    filtroFecha.addEventListener('change', applyFilters);
    filtroEstado.addEventListener('change', applyFilters);
    prevBtn.addEventListener('click', () => { if(currentPage>1){ currentPage--; renderPage(); }});
    nextBtn.addEventListener('click', () => { if(currentPage < Math.ceil(filtered.length/rowsPerPage)){ currentPage++; renderPage(); }});

    // Modal events
    btnAbrir.addEventListener('click', () => openModal());
    btnCerrar.addEventListener('click', closeModal);
    btnCancelar.addEventListener('click', closeModal);
    formGuardar.addEventListener('click', () => {
      // UI-only: animación de guardado y cierre. Aquí se debe integrar el POST/PUT en el backend.
      showToast('Guardando turno (solo UI)...', 1200);
      setTimeout(() => { closeModal(); }, 700);
    });

    // Delegación para botones de fila (solo UI)
    tabla.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if(!btn) return;
      const tr = btn.closest('tr');
      if(btn.classList.contains('btn-ver-turno')) {
        highlightRow(tr);
        showToast('Vista rápida (UI) del turno', 900);
      } else if(btn.classList.contains('btn-editar-turno')) {
        openModalForRow(tr);
      } else if(btn.classList.contains('btn-eliminar-turno')) {
        // UI-only: animación de eliminación
        tr.animate([{ opacity:1 }, { opacity:0, transform:'translateX(-10px)' }], { duration:300 }).onfinish = () => {
          tr.remove();
          applyCounts();
          applyFilters();
          showToast('Turno eliminado (solo UI)', 900);
        };
      }
    });

    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
    });
  }

  /* Filtrado en el DOM */
  function applyFilters(){
    const q = (buscar.value || '').toLowerCase().trim();
    const fecha = filtroFecha.value;
    const estado = (filtroEstado.value || '').toLowerCase();

    filtered = filas().filter(tr => {
      const text = tr.textContent.toLowerCase();
      if(q && !text.includes(q)) return false;
      if(fecha){
        const fechaCell = tr.children[3] ? tr.children[3].textContent.trim() : '';
        if(!fechaCell.includes(fecha)) return false;
      }
      if(estado){
        const est = (tr.dataset.estado || '').toLowerCase();
        if(est !== estado) return false;
      }
      return true;
    });

    currentPage = 1;
    renderPage();
    applyCounts();
  }

  function renderPage(){
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    filas().forEach((tr, idx) => {
      tr.style.display = 'none';
    });
    filtered.slice(start, end).forEach(tr => tr.style.display = '');
    const total = filtered.length;
    const displayStart = total === 0 ? 0 : start + 1;
    const displayEnd = Math.min(end, total);
    infoPagina.textContent = `${displayStart} - ${displayEnd} de ${total} Turnos`;
    // Desactivar botones según página
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= Math.ceil(Math.max(1,total)/rowsPerPage);
  }

  function applyCounts(){
    const total = filas().length;
    totalTurnosEl.textContent = total;
    if(turnosRegistradosEl) turnosRegistradosEl.textContent = total;
  }

  /* Modal UI */
  function openModal(){
    modal.setAttribute('aria-hidden','false');
    modalTitle.textContent = 'Nuevo Turno';
    // animación suave de foco
    setTimeout(() => document.getElementById('form_id_mascota')?.focus(), 220);
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
  }
  function openModalForRow(tr){
    modal.setAttribute('aria-hidden','false');
    modalTitle.textContent = 'Editar Turno';
    // rellenar campos UI con datos de la fila (si están presentes)
    const cells = tr.children;
    document.getElementById('form_id_historial').value = cells[0]?.textContent.trim() || '';
    // id_mascota está dentro del bloque mascota-info: buscamos el span con "ID Mascota"
    const idMascotaSpan = tr.querySelector('.mascota-info span');
    if(idMascotaSpan){
      const match = idMascotaSpan.textContent.match(/ID Mascota:\s*(\d+)/i);
      if(match) document.getElementById('form_id_mascota').value = match[1];
    }
    document.getElementById('form_id_veterinario').value = cells[2]?.textContent.trim() || '';
    // fecha
    const fechaText = cells[3]?.textContent.trim() || '';
    // intentar convertir a datetime-local si es posible (UI-only)
    const dt = new Date(fechaText);
    if(!isNaN(dt)) {
      const pad = n => String(n).padStart(2,'0');
      const val = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      document.getElementById('form_fecha').value = val;
    } else {
      document.getElementById('form_fecha').value = '';
    }
    document.getElementById('form_motivo').value = cells[4]?.textContent.trim() || '';
    document.getElementById('form_diagnostico').value = cells[5]?.textContent.trim() || '';
    document.getElementById('form_observacion').value = cells[6]?.textContent.trim() || '';
  }

  /* Micro-feedback (toast) */
  function showToast(msg, ms = 1000){
    let toast = document.getElementById('uiToast');
    if(!toast){
      toast = document.createElement('div');
      toast.id = 'uiToast';
      toast.style.position = 'fixed';
      toast.style.right = '18px';
      toast.style.bottom = '18px';
      toast.style.background = 'rgba(15,23,42,0.92)';
      toast.style.color = '#fff';
      toast.style.padding = '10px 14px';
      toast.style.borderRadius = '10px';
      toast.style.boxShadow = '0 8px 30px rgba(2,6,23,0.4)';
      toast.style.zIndex = 120;
      toast.style.fontSize = '13px';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.animate([{ transform:'translateY(6px)', opacity:0 }, { transform:'translateY(0)', opacity:1 }], { duration:220, easing:'ease-out' });
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toast.animate([{ opacity:1 }, { opacity:0, transform:'translateY(6px)' }], { duration:220 }).onfinish = () => {
        toast.style.opacity = '0';
      };
    }, ms);
  }

  /* Helpers */
  function debounce(fn, ms=200){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
  }

  function highlightRow(tr){
    tr.animate([{ boxShadow:'0 0 0 rgba(0,0,0,0)' }, { boxShadow:'0 8px 30px rgba(43,124,255,0.12)' }], { duration:420, easing:'ease-out' });
  }

})();
