const fs = require('fs');
const path = './proyect-folder/data/carts.json';

class CartsManager {
  constructor() {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify([]));
    }
  }

  // Obtener todos los carritos
  async getAll() {
    const data = await fs.promises.readFile(path, 'utf-8');
    return JSON.parse(data);
  }

  // Obtener un carrito por ID
  async getById(id) {
    const carts = await this.getAll();
    console.log(carts);  // Verifica si los carritos están siendo cargados
    return carts.find((c) => c.id === id) || null;
  }

  // Crear un nuevo carrito
  async addCart() {
    const carts = await this.getAll();
    const newCart = {
      id: carts.length > 0 ? carts[carts.length - 1].id + 1 : 1,
      products: [], // Solo IDs de productos
    };
    carts.push(newCart);
    await fs.promises.writeFile(path, JSON.stringify(carts, null, 2));
    return newCart;
  }

  async addProductToCart(cid, productId, quantity) {
    const cart = await this.getById(cid); // Obtenemos el carrito
    if (!cart) return null; // Si no existe el carrito, devolvemos null
  
    // Buscamos si el producto ya está en el carrito
    const existingProduct = cart.products.find(p => p.product === productId);
    if (existingProduct) {
      // Si el producto ya está en el carrito, solo actualizamos la cantidad
      existingProduct.quantity += quantity;
    } else {
      // Si el producto no está en el carrito, lo agregamos
      cart.products.push({ product: productId, quantity });
    }
  
    // Guardamos el carrito actualizado
    const carts = await this.getAll();
    const cartIndex = carts.findIndex(c => c.id === cid);
    if (cartIndex !== -1) {
      carts[cartIndex] = cart; // Reemplazamos el carrito actualizado en la lista
    }
    
    await fs.promises.writeFile(path, JSON.stringify(carts, null, 2)); // Guardamos los cambios
    return cart;
  }
  


  // Eliminar producto del carrito
  async removeProductFromCart(cartId, productId) {
    const carts = await this.getAll();
    const cart = carts.find((c) => c.id === cartId);
    if (!cart) return null;

    cart.products = cart.products.filter(p => p.product !== productId);
    await fs.promises.writeFile(path, JSON.stringify(carts, null, 2));
    return cart;
  }

  // Actualizar la cantidad de un producto en el carrito
  async updateProductQuantity(cartId, productId, quantity) {
    const carts = await this.getAll();
    const cart = carts.find((c) => c.id === cartId);
    if (!cart) return null;

    const product = cart.products.find(p => p.product === productId);
    if (product) {
      product.quantity = quantity;
      if (product.quantity <= 0) {
        await this.removeProductFromCart(cartId, productId); // Eliminar si la cantidad es 0
      } else {
        await fs.promises.writeFile(path, JSON.stringify(carts, null, 2));
      }
    }
    return cart;
  }

  // Eliminar todos los productos del carrito
  async removeAllProductsFromCart(cartId) {
    const carts = await this.getAll();
    const cart = carts.find((c) => c.id === cartId);
    if (!cart) return null;

    cart.products = [];
    await fs.promises.writeFile(path, JSON.stringify(carts, null, 2));
    return cart;
  }
}

module.exports = CartsManager;
