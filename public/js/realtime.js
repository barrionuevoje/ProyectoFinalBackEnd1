const socket = io();

// Capturar elementos del DOM
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');

// Agregar producto
productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const price = parseFloat(document.getElementById('price').value);

    if (title && price) {
        socket.emit('newProduct', { title, price });
        productForm.reset();
    }
});

// Escuchar actualización de productos
socket.on('updateProducts', (products) => {
    productList.innerHTML = '';
    products.forEach(product => {
        const li = document.createElement('li');
        li.id = `product-${product.id}`;
        li.innerHTML = `${product.title} - $${product.price} <button onclick="deleteProduct(${product.id})">Eliminar</button>`;
        productList.appendChild(li);
    });
});

// Eliminar producto
function deleteProduct(id) {
    socket.emit('deleteProduct', id);
}
