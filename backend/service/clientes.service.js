const ClienteModel = require('../models/clientes.model');

const ClienteService={
    listarclientes:async (req , res)=>{
        try{
            const clientes = await ClienteModel.obtnerTodos();
            res.json(clientes);
        } catch (error){
            res.status(500).json({error});
        }
    }
}

module.exports = ClienteService;