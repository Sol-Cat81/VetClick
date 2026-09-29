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

        tbody.innerHTML = turnos.map(turno =>{
            const estado = String(turno.estado || 'PENDIENTE').toUpperCase();
            const claseEstado = clasesEstadoTurno[estado] || 'warning';
            return`
            <tr>
                <td>${escaparHtml(turno.id_turno)}</td>
                <td>${escaparHtml(turno.fecha)}</td>
                <td>${escaparHtml(turno.hora)}</td>
                <td>${escaparHtml(turno.mascota)}</td>
                <td>${escaparHtml(turno.cliente)}</td>
                <td>${escaparHtml(turno.servicio)}</td>
                <td>${escaparHtml(turno.sucursal)}</td>
                <td>${escaparHtml(turno.motivo)}</td>
                <td><span class = "status ${claseEstado}">${estado}</span></td>
                <td><button class="btn btn-secondary" data-toast="Editar turno #${escaparHtml(turno.id_turno)}">Editar</button> </td>
            </tr>
            `;}).join('');
    }catch(error){
    informarErrorCarga('turnos', error);
  }
};

async function cargarHistorialMedico(){
    try{
        const historiales = await obtenerDatos('clinica/historial');
        const tbody = document.querySelector('#historial-table tbody');
        
        if(!tbody) return;

        tbody.innerHTML = historiales.map(historial =>`
            <tr>
            <td>${escaparHtml(historial.id_historial)}</td>
            <td>${escaparHtml(historial.fecha)}</td>
            <td>${escaparHtml(historial.paciente)}</td>
            <td>${escaparHtml(historial.veterinario)}</td>
            <td>${escaparHtml(historial.motivo)}</td>
            <td>${escaparHtml(historial.diagnostico)}</td>
            <td>${escaparHtml(historial.observacion)}</td>
            <td><button class="btn btn-secondary" data-toast="Editar historial #${escaparHtml(historial.id_historial)}">Editar</button></td>
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
        tbody.innerHTML = tratamientos.map(tratamiento => `
            <tr>
                <td>${escaparHtml(tratamiento.id_tratamiento)}</td>
                <td>${escaparHtml(tratamiento.id_historial)}</td>
                <td>${escaparHtml(tratamiento.medicamento)}</td>
                <td>${escaparHtml(tratamiento.dosis)}</td>
                <td>${escaparHtml(tratamiento.frecuencia)}</td>
                <td>${escaparHtml(tratamiento.duracion)}</td>
            </tr>
        `).join('');
    }catch(error){ informarErrorCarga('clinica/tratamientos', error); }
}

async function cargarVacunas(){
    try{
        const vacunas = await obtenerDatos('clinica/vacunas');
        const tbody = document.querySelector('#vacunas-table tbody');
        if(!tbody) return;
        tbody.innerHTML = vacunas.map(vacuna => `
            <tr>
                <td>${escaparHtml(vacuna.id_vacuna)}</td>
                <td>${escaparHtml(vacuna.paciente)}</td>
                <td>${escaparHtml(vacuna.nombre)}</td>
                <td>${escaparHtml(vacuna.fecha_aplicacion)}</td>
                <td>${escaparHtml(vacuna.fecha_proxima)}</td>
                <td>${escaparHtml(vacuna.veterinario)}</td>
            </tr>
        `).join('');
    }catch(error){ informarErrorCarga('clinica/vacunas', error); }
}

async function cargarServicios(){
    try{
        const servicios = await obtenerDatos('clinica/servicios');
        const tbody = document.querySelector('#servicios-table tbody');
        if(!tbody) return;
        tbody.innerHTML = (servicios || []).map(servicio => `
            <tr>
                <td>${escaparHtml(servicio.id_servicio)}</td>
                <td>${escaparHtml(servicio.nombre)}</td>
                <td>${escaparHtml(servicio.categoria || '—')}</td>
                <td>$${escaparHtml(servicio.precio)}</td>
                <td>${escaparHtml(servicio.descripcion)}</td>
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
        tbody.innerHTML = (categorias || []).map(categoria => `
            <tr>
                <td>${escaparHtml(categoria.id_categoria_servicio)}</td>
                <td>${escaparHtml(categoria.nombre)}</td>
            </tr>
        `).join('');
    }catch(error){ informarErrorCarga('clinica/categorias-servicios', error); }
}