const express = require('express');
const ProductManager = require('../../ProductManager');

const router = express.Router();
const productManager = new ProductManager();

// GET /api/products/ - Listar todos los productos con filtros, paginación y ordenamiento
router.get('/', async (req, res) => {
  const { limit = 10, page = 1, sort = '', query = '' } = req.query;

  const queryObject = {};

  // Si se proporciona un filtro de categoría o disponibilidad, lo añadimos al queryObject
  if (query) {
    queryObject.$or = [
      { category: { $regex: query, $options: 'i' } },
      { availability: { $regex: query, $options: 'i' } },
    ];
  }

  // Configuración de paginación y ordenamiento
  const options = {
    limit: parseInt(limit),
    skip: (page - 1) * limit,
  };

  // Si se especifica ordenamiento por precio, lo añadimos
  if (sort) {
    const sortOrder = sort === 'asc' ? 1 : -1;  // 1 para ascendente, -1 para descendente
    options.sort = { price: sortOrder };
  }

  try {
    // Obtén los productos filtrados, paginados y ordenados
    const products = await productManager.getAll(queryObject, options);

    // Total de productos para calcular las páginas
    const totalProducts = await productManager.getCount(queryObject);
    const totalPages = Math.ceil(totalProducts / limit);

    // Respuesta con datos de paginación y productos
    res.json({
      status: 'success',
      payload: products,
      totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
      page,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevLink: page > 1 ? `/api/products?limit=${limit}&page=${page - 1}&sort=${sort}&query=${query}` : null,
      nextLink: page < totalPages ? `/api/products?limit=${limit}&page=${page + 1}&sort=${sort}&query=${query}` : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error en el servidor' });
  }
});

// GET /api/products/:pid - Ver los detalles de un producto
router.get('/:pid', async (req, res) => {
  const productId = parseInt(req.params.pid);
  const product = await productManager.getById(productId);
  
  if (!product) return res.status(404).send('Producto no encontrado');
  
  // Renderizamos la vista 'productDetail' y le pasamos el producto
  res.render('productDetail', { product });
});

// POST /api/products - Crear un nuevo producto
router.post('/', async (req, res) => {
  const { name, description, price, category, availability } = req.body;
  console.log('Producto recibido:', req.body);  // Agrega esta línea para depurar

  if (!name || !description || !price) {
    return res.status(400).json({ status: 'error', message: 'Faltan datos requeridos' });
  }

  const newProduct = {
    name,
    description,
    price,
    category,
    availability
  };

  try {
    const createdProduct = await productManager.add(newProduct);
    res.status(201).json(createdProduct); // Responde con el producto recién creado
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al agregar el producto' });
  }
});

// DELETE /api/products/:id - Eliminar un producto
router.delete('/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const result = await productManager.delete(productId);

  if (result) {
    res.status(200).json({ status: 'success', message: 'Producto eliminado' });
  } else {
    res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
  }
});

module.exports = router;
