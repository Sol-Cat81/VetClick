const db = require("./../config/database");

const solicitarProductosDestacados = async(req, res) =>{
    try {
        const [ destacados ] = await db.query(`SELECT 
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.descuento,
            v.id_variante,
            v.id_valor_atributo,
            av.nombre AS atributo,
            v.precio,
            v.stock,
            p.imagen
            FROM productos AS p 
            INNER JOIN variantes AS v
            ON p.id_producto = v.id_producto 
            INNER JOIN valores_atributo AS av
            ON v.id_valor_atributo = av.id_valor
            `);

        const ordenarDest = {}

        destacados.forEach(producto => {
            if(!ordenarDest[producto.id_producto]){
                ordenarDest[producto.id_producto] = {
                    id: producto.id_producto,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                    descuento: producto.descuento,
                    imagen: producto.imagen,
                    variantes: []
                }
            }

            ordenarDest[producto.id_producto].variantes.push({
                id: producto.id_variante,
                id_atributo: producto.id_valor_atributo,
                precio: producto.precio,
                stock: producto.stock,
                atributo: producto.atributo
            })
        } )
        
        res.status(201).json(Object.values(ordenarDest))
    } catch (error) {
        console.error("Error al consultar productos: ", error);
        res.status(500).json({ mensaje: "Hubo un error en el servidor" });
    }
}

module.exports = { solicitarProductosDestacados }