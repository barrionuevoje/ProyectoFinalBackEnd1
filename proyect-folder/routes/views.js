const express = require('express');
const ProductManager = require('../../ProductManager');

const router = express.Router();
const productManager = new ProductManager();

// Ruta Home
router.get('/', async (req, res) => {
    const products = await productManager.getAll();
    res.render('home', { products });
});

// Ruta Real-Time Products con WebSockets
router.get('/realtimeproducts', async (req, res) => {
    const products = await productManager.getAll();
    res.render('realTimeProducts', { products });
});

module.exports = router;
