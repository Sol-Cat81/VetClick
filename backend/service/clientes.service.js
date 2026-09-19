// El service conecta la ruta con el modelo y decide la respuesta HTTP.
const ClienteModel = require('../models/clientes.model');

const ClienteService={
    // Atiende GET /api/clientes.
    listarclientes:async (req , res)=>{
        try{
            // Pedimos los datos al modelo.
            const clientes = await ClienteModel.obtnerTodos();
            // Respondemos JSON para que el frontend pueda consumirlo.
            res.json(clientes);
        } catch (error){
            // Un error de base se convierte en HTTP 500 y queda registrado.
            console.error('Error al listar clientes:', error);
            res.status(500).json({error});
        }
    }
}

module.exports = ClienteService;