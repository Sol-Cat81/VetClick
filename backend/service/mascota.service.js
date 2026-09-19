// Service de mascotas: recibe la solicitud y llama al modelo.
const MascotasModel = require ('../models/mascotas.model');

const MascotaService = {
    // Atiende GET /api/mascotas.
    listarMascotas: async(req , res)=>{
        try{
            const mascotas = await MascotasModel.obtnerTodos();
            res.json(mascotas);
        }catch(error){
            console.error('Error al listar mascotas:', error);
            res.status(500).json({error});
        }
    }
};

module.exports = MascotaService;