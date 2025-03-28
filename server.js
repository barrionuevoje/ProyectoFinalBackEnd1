const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars'); // <- Correcto, Handlebars es la plantilla

const productsRouter = require('./proyect-folder/routes/products');
const cartsRouter = require('./proyect-folder/routes/carts');
const viewsRouter = require('./proyect-folder/routes/views');
const methodOverride = require('method-override');


const ProductManager = require('./ProductManager');
const CartManager = require('./CartsManager'); // Correcto, importamos CartManager

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 8080;

// Instancia de los manejadores
const productManager = new ProductManager();
const cartManager = new CartManager(); // Instancia de CartManager

// Configurar Handlebars correctamente
app.engine('handlebars', engine()); // Configuración de Handlebars
app.set('view engine', 'handlebars');
app.set('views', './proyect-folder/views'); // Carpeta de vistas
app.use(methodOverride('_method'));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Servir archivos estáticos

// Configuración de las rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Escuchar evento de nuevo producto
    socket.on('newProduct', async (product) => {
        await productManager.add(product);
        const products = await productManager.getAll();
        io.emit('updateProducts', products); // Enviar actualización a todos los clientes
    });

    // Escuchar evento de eliminar producto
    socket.on('deleteProduct', async (id) => {
        await productManager.delete(id);
        const products = await productManager.getAll();
        io.emit('updateProducts', products); // Enviar actualización a todos los clientes
    });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
