const MascotasModel = require ('../models/mascotas.model');

const MascotaService = {
    listarMascotas: async(req , res)=>{
        try{
            const mascotas = await MascotasModel.obtnerTodos();
            res.json(mascotas);
        }catch(error){
            res.status(500).json({error});
        }
    }
};

module.exports = MascotaService;