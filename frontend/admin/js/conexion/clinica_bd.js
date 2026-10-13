// Objetos completos de cada registro, para rellenar los modales de edicion y
// el detalle sin depender del texto visible de la tabla.
const turnosPorId = new Map();
const historialPorId = new Map();
const tratamientosPorId = new Map();
const vacunasPorId = new Map();
const serviciosPorId = new Map();
const categoriasServicioPorId = new Map();

function guardarEnRegistro(mapa, filas, campoId){
    mapa.clear();
    (filas || []).forEach(fila => mapa.set(String(fila[campoId]), fila));
}

function invalidarClinicaCargada(){
    turnosPorId.clear();
    historialPorId.clear();
    tratamientosPorId.clear();
    vacunasPorId.clear();
    serviciosPorId.clear();
    categoriasServicioPorId.clear();
}

async function cargarTurnos() {
    try{
        const turnos = await obtenerDatos('clinica/turnos');
        const tbody = document.querySelector('#turnos-table tbody');
        const clasesEstadoTurno = {
            PENDIENTE: 'warning',
            CONFIRMADO: 'info',
            CANCELADO: 'danger',
            FINALIZADO: 'success'
        };
       if(!tbody) return;

        guardarEnRegistro(turnosPorId, turnos, 'id_turno');
        tbody.innerHTML = turnos.map(turno =>{
            const estado = String(turno.estado || 'PENDIENTE').toUpperCase();
            const claseEstado = clasesEstadoTurno[estado] || 'warning';
            return`
            <tr data-id="${escaparHtml(turno.id_turno)}">
                <td>${escaparHtml(turno.id_turno)}</td>
                <td>${escaparHtml(String(turno.fecha || '').slice(0, 10))}</td>
                <td>${escaparHtml(turno.mascota)}</td>
                <td>${escaparHtml(turno.servicio)}</td>
                <td><span class = "status ${claseEstado}">${estado}</span></td>
            </tr>
            `;}).join('');
    }catch(error){
    InformarErrorCarga('turnos', error);
  }
};

async function cargarHistorialMedico(){
    try{
        const historiales = await obtenerDatos('clinica/historial');
        const tbody = document.querySelector('#historial-table tbody');
        
        if(!tbody) return;

        guardarEnRegistro(historialPorId, historiales, 'id_historial');
        tbody.innerHTML = historiales.map(historial =>`
            <tr data-id="${escaparHtml(historial.id_historial)}">
            <td>${escaparHtml(historial.id_historial)}</td>
            <td>${escaparHtml(String(historial.fecha || '').slice(0, 10))}</td>
            <td>${escaparHtml(historial.paciente)}</td>
            <td>${escaparHtml(historial.veterinario)}</td>
            </tr>
            `).join('');
    }catch(error){
        informarErrorCarga('clinica/historial', error)
    }
}

async function cargarTratamientos(){
    try{
        const tratamientos = await obtenerDatos('clinica/tratamientos');
        const tbody = document.querySelector('#tratamientos-table tbody');
        if(!tbody) return;
        guardarEnRegistro(tratamientosPorId, tratamientos, 'id_tratamiento');
        tbody.innerHTML = tratamientos.map(tratamiento => `
            <tr data-id="${escaparHtml(tratamiento.id_tratamiento)}">
                <td>${escaparHtml(tratamiento.id_tratamiento)}</td>
                <td>${escaparHtml(tratamiento.medicamento)}</td>
                <td>${escaparHtml([tratamiento.paciente, String(tratamiento.historial_fecha || '').slice(0, 10)]
                    .filter(Boolean).join(' — ') || '—')}</td>
                <td>${escaparHtml(tratamiento.dosis)}</td>
            </tr>
        `).join('');
    }catch(error){ informarErrorCarga('clinica/tratamientos', error); }
}

async function cargarVacunas(){
    try{
        const vacunas = await obtenerDatos('clinica/vacunas');
        const tbody = document.querySelector('#vacunas-table tbody');
        if(!tbody) return;
        guardarEnRegistro(vacunasPorId, vacunas, 'id_vacuna');
        tbody.innerHTML = vacunas.map(vacuna => `
            <tr data-id="${escaparHtml(vacuna.id_vacuna)}">
                <td>${escaparHtml(vacuna.id_vacuna)}</td>
                <td>${escaparHtml(vacuna.paciente)}</td>
                <td>${escaparHtml(vacuna.nombre)}</td>
                <td>${escaparHtml(String(vacuna.fecha_proxima || '').slice(0, 10) || '—')}</td>
            </tr>
        `).join('');
    }catch(error){ informarErrorCarga('clinica/vacunas', error); }
}

async function cargarServicios(){
    try{
        const servicios = await obtenerDatos('clinica/servicios');
        const tbody = document.querySelector('#servicios-table tbody');
        if(!tbody) return;
        guardarEnRegistro(serviciosPorId, servicios, 'id_servicio');
        tbody.innerHTML = (servicios || []).map(servicio => `
            <tr data-id="${escaparHtml(servicio.id_servicio)}">
                <td>${escaparHtml(servicio.id_servicio)}</td>
                <td>${escaparHtml(servicio.nombre)}</td>
                <td>$${escaparHtml(servicio.precio)}</td>
                <td><span class="status ${servicio.activo ? 'success' : 'warning'}">${servicio.activo ? 'Activo' : 'Inactivo'}</span></td>
            </tr>
        `).join('');
    }catch(error){ informarErrorCarga('clinica/servicios', error); }
}

async function cargarCategoriasServicio(){
    try{
        const categorias = await obtenerDatos('clinica/categorias-servicios');
        const tbody = document.querySelector('#categorias-servicio-table tbody');
        if(!tbody) return;
        guardarEnRegistro(categoriasServicioPorId, categorias, 'id_categoria_servicio');
        tbody.innerHTML = (categorias || []).map(categoria => `
            <tr data-id="${escaparHtml(categoria.id_categoria_servicio)}">
                <td>${escaparHtml(categoria.id_categoria_servicio)}</td>
                <td>${escaparHtml(categoria.nombre)}</td>
            </tr>
        `).join('');
    }catch(error){ informarErrorCarga('clinica/categorias-servicios', error); }
}
// ===================================================================
// De que columna del registro sale cada campo visible del modal.
// Los campos que no aparecen (los inputs de archivo) se dejan como estan.
// ===================================================================
registrarFormulario('turno', {
    fecha: 'fecha', hora: 'hora', motivo: 'motivo', estado: 'estado',
    observaciones: 'observaciones',
    mascota_busqueda: 'id_mascota', cliente_busqueda: 'id_cliente',
    servicio_busqueda: 'id_servicio', sucursal_busqueda: 'id_sucursal'
}, turnosPorId);

registrarFormulario('historial médico', {
    fecha: 'fecha', motivo: 'motivo', diagnostico: 'diagnostico', observacion: 'observacion',
    mascota_busqueda: 'id_mascota', veterinario_busqueda: 'id_veterinario'
}, historialPorId);

registrarFormulario('tratamiento', {
    historial_busqueda: 'id_historial', medicamento: 'medicamento', dosis: 'dosis'
}, tratamientosPorId);

registrarFormulario('vacuna', {
    nombre: 'nombre', fecha_aplicacion: 'fecha_aplicacion', fecha_proxima: 'fecha_proxima',
    mascota_busqueda: 'id_mascota', veterinario_busqueda: 'id_veterinario'
}, vacunasPorId);

registrarFormulario('servicio', {
    nombre: 'nombre', precio: 'precio', descripcion: 'descripcion', activo: 'activo',
    categoria_servicio_busqueda: 'id_categoria_servicio'
}, serviciosPorId);

registrarFormulario('categoría de servicio', { nombre: 'nombre' }, categoriasServicioPorId);

// ===================================================================
// Detalle: que se ve en la tabla y que aparece en el modal "Ver mas".
// Los textos largos y las claves foraneas quedan fuera de la tabla para
// que las filas no se deformen; aca se muestran completos.
// ===================================================================
detalleEntidades['turno'] = {
  titulo: 'Turno',
  registro: turnosPorId,
  campos: [
    { campo: 'id_turno', etiqueta: 'ID' },
    { campo: 'fecha', etiqueta: 'Fecha', fecha: true },
    { campo: 'hora', etiqueta: 'Hora', hora: true },
    { campo: 'mascota', etiqueta: 'Paciente' },
    { campo: 'cliente', etiqueta: 'Cliente' },
    { campo: 'servicio', etiqueta: 'Servicio' },
    { campo: 'sucursal', etiqueta: 'Sucursal' },
    { campo: 'estado', etiqueta: 'Estado' },
    { campo: 'motivo', etiqueta: 'Motivo', texto: true },
    { campo: 'observaciones', etiqueta: 'Observaciones', texto: true }
  ]
};

detalleEntidades['historial médico'] = {
  titulo: 'Historial médico',
  registro: historialPorId,
  campos: [
    { campo: 'id_historial', etiqueta: 'ID' },
    { campo: 'fecha', etiqueta: 'Fecha', fecha: true },
    { campo: 'paciente', etiqueta: 'Paciente' },
    { campo: 'veterinario', etiqueta: 'Veterinario' },
    { campo: 'motivo', etiqueta: 'Motivo', texto: true },
    { campo: 'diagnostico', etiqueta: 'Diagnóstico', texto: true },
    { campo: 'observacion', etiqueta: 'Observación', texto: true }
  ]
};

detalleEntidades.tratamiento = {
  titulo: 'Tratamiento',
  registro: tratamientosPorId,
  campos: [
    { campo: 'id_tratamiento', etiqueta: 'ID' },
    { campo: 'medicamento', etiqueta: 'Medicamento' },
    { campo: 'dosis', etiqueta: 'Dosis' },
    { campo: 'frecuencia', etiqueta: 'Frecuencia' },
    { campo: 'duracion', etiqueta: 'Duración' },
    { campo: 'paciente', etiqueta: 'Paciente' },
    { campo: 'historial_fecha', etiqueta: 'Fecha del historial', fecha: true }
  ]
};

detalleEntidades.vacuna = {
  titulo: 'Vacuna',
  registro: vacunasPorId,
  campos: [
    { campo: 'id_vacuna', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Vacuna' },
    { campo: 'paciente', etiqueta: 'Paciente' },
    { campo: 'fecha_aplicacion', etiqueta: 'Aplicación', fecha: true },
    { campo: 'fecha_proxima', etiqueta: 'Próxima', fecha: true },
    { campo: 'veterinario', etiqueta: 'Veterinario' }
  ]
};

detalleEntidades.servicio = {
  titulo: 'Servicio',
  registro: serviciosPorId,
  campos: [
    { campo: 'id_servicio', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Servicio' },
    { campo: 'precio', etiqueta: 'Precio', sufijo: ' $' },
    { campo: 'activo', etiqueta: 'Estado', booleano: ['Inactivo', 'Activo'] },
    { campo: 'categoria', etiqueta: 'Categoría' },
    { campo: 'descripcion', etiqueta: 'Descripción', texto: true }
  ]
};

detalleEntidades['categoría de servicio'] = {
  titulo: 'Categoría de servicio',
  registro: categoriasServicioPorId,
  campos: [
    { campo: 'id_categoria_servicio', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Categoría' }
  ]
};
