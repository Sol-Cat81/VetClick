const model = require('../models/inventario.model');
const { diasDeAtencion } = require('../config/horarios');

module.exports = {
  listarStock: model.stock,
  // Las sucursales con los dias de la semana que atienden. El texto del
  // horario ("Lun a Sab 09:00 a 20:00") se parsea para que la pagina de
  // turnos no ofrezca dias que la sucursal esta cerrada.
  listarSucursales: async () => {
    const sucursales = await model.sucursales();
    return sucursales.map((sucursal) => ({
      ...sucursal,
      dias_atencion: diasDeAtencion(sucursal.horario),
    }));
  },
};
