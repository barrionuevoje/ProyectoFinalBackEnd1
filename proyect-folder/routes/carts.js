const express = require('express');
const CartManager = require('../../CartsManager');
const ProductManager = require('../../ProductManager'); // Para manejar los productos
const router = express.Router();
const cartManager = new CartManager();
const productManager = new ProductManager(); // Necesitamos esto para obtener detalles del producto

// GET /api/carts
router.get('/', async (req, res) => {
  try {
    const carts = await cartManager.getAll();
    res.status(200).json(carts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al obtener los carritos' });
  }
});

// POST /api/carts - Crear un nuevo carrito
router.post('/', async (req, res) => {
  try {
    const newCart = await cartManager.addCart();
    res.status(201).json(newCart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al crear el carrito' });
  }
});

// POST /api/carts/:cid/products - Agregar producto al carrito
router.post('/:cid/products', async (req, res) => {
  const { cid } = req.params;
  const { productId, quantity } = req.body; // Recibimos el producto y la cantidad

  // Verifica que productId y quantity estén presentes en el cuerpo
  if (!productId || !quantity) {
    return res.status(400).json({ status: 'error', message: 'Faltan parámetros (productId o quantity)' });
  }

  const cartId = parseInt(cid);  // Convertimos cid a un número
  const productIdInt = parseInt(productId); // Convertimos productId a un número

  if (isNaN(cartId) || isNaN(productIdInt)) {
    return res.status(400).json({ status: 'error', message: 'ID inválido' });
  }

  try {
    const updatedCart = await cartManager.addProductToCart(cartId, productIdInt, quantity);
    if (!updatedCart) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }
    res.status(200).json(updatedCart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al agregar producto al carrito' });
  }
});

// DELETE /api/carts/:cid/products/:pid - Eliminar producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
  const { cid, pid } = req.params;
  const cartId = parseInt(cid);
  const productId = parseInt(pid);

  if (isNaN(cartId) || isNaN(productId)) {
    return res.status(400).json({ status: 'error', message: 'ID inválido' });
  }

  const updatedCart = await cartManager.removeProductFromCart(cartId, productId);
  if (!updatedCart) return res.status(404).send('Carrito no encontrado');
  res.json(updatedCart);
});

// PUT /api/carts/:cid/products/:pid - Actualizar cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res) => {
  const { cid, pid } = req.params;
  const { quantity } = req.body; // La cantidad a actualizar

  const cartId = parseInt(cid);
  const productId = parseInt(pid);

  if (isNaN(cartId) || isNaN(productId)) {
    return res.status(400).json({ status: 'error', message: 'ID inválido' });
  }

  const updatedCart = await cartManager.updateProductQuantity(cartId, productId, quantity);
  if (!updatedCart) return res.status(404).send('Carrito no encontrado');
  res.json(updatedCart);
});

// DELETE /api/carts/:cid - Eliminar todos los productos del carrito
router.delete('/:cid', async (req, res) => {
  const { cid } = req.params;
  const cartId = parseInt(cid);

  if (isNaN(cartId)) {
    return res.status(400).json({ status: 'error', message: 'ID inválido' });
  }

  const updatedCart = await cartManager.removeAllProductsFromCart(cartId);
  if (!updatedCart) return res.status(404).send('Carrito no encontrado');
  res.json(updatedCart);
});

// GET /api/carts/:cid/products - Obtener los productos del carrito con detalles
router.get('/:cid/products', async (req, res) => {
  const cartId = parseInt(req.params.cid);

  if (isNaN(cartId)) {
    return res.status(400).json({ status: 'error', message: 'ID inválido' });
  }

  const cart = await cartManager.getById(cartId);
  if (!cart) return res.status(404).send('Carrito no encontrado');
  
  // Poblamos los productos con los detalles
  const populatedProducts = await Promise.all(cart.products.map(async (product) => {
    const productDetails = await productManager.getById(product.product); // Suponiendo que tienes un método getById
    return {
      ...product,
      product: productDetails, // Detalles del producto
    };
  }));

  res.json(populatedProducts);
});

// GET /api/carts/:cid - Obtener los productos de un carrito específico (en formato JSON)
router.get('/:cid', async (req, res) => {
  const cartId = parseInt(req.params.cid);

  if (isNaN(cartId)) {
    return res.status(400).json({ status: 'error', message: 'ID inválido' });
  }

  const cart = await cartManager.getById(cartId);
  if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

  // Poblamos los productos con los detalles
  const populatedProducts = await Promise.all(cart.products.map(async (product) => {
    const productDetails = await productManager.getById(product.product); // Suponiendo que tienes un método getById
    return {
      ...product,
      product: productDetails, // Detalles del producto
    };
  }));

  // Calcular el total con validación de precio
  const total = populatedProducts.reduce((acc, product) => {
    if (product.product && product.product.price) {
      return acc + (product.product.price * product.quantity);
    }
    return acc;  // Si el precio no está definido, no lo sumamos
  }, 0);

  // Ahora enviamos los datos del carrito y el total en formato JSON
  res.status(200).json({ cart: { ...cart, products: populatedProducts }, total });
});

module.exports = router;
