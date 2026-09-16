const db = require("./../config/database");

const solicitarProductosDestacados = async(req, res) =>{
    try {
        const [ destacados ] = await db.query(`SELECT 
            p.id_producto,
            p.nombre,
            p.descripcion,
            v.id_variante,
            v.precio,
            v.stock,
            v.imagen
            FROM productos AS p 
            INNER JOIN variantes AS v
            ON p.id_producto = v.id_producto
            `);

        const ordenarDest = {}

        destacados.forEach(producto => {
            if(!ordenarDest[producto.id_producto]){
                ordenarDest[producto.id_producto] = {
                    id: producto.id_producto,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                    variantes: []
                }
            }

            ordenarDest[producto.id_producto].variantes.push({
                id: producto.id_variante,
                precio: producto.precio,
                stock: producto.stock,
                imagen: producto.imagen
            })
        } )
        
        res.status(201).json(Object.values(ordenarDest))
    } catch (error) {
        console.error("Error al consultar productos: ", error);
        res.status(500).json({ mensaje: "Hubo un error en el servidor" });
    }
}

module.exports = { solicitarProductosDestacados }