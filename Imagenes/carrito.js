/* Urban Void - lógica del carrito
   Se incluye en TODAS las páginas con: <script src="carrito.js"></script>
   Los productos se guardan en localStorage, así que el carrito
   sobrevive al cambiar de página y al recargar. */

const CART_KEY = 'urbanvoid_cart';

/* ---------- Datos ---------- */

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function formatPrice(n) {
    return '$' + Number(n).toFixed(2);
}

/* ---------- Contador del header (todas las páginas) ---------- */

function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('#cart-count').forEach(el => {
        el.textContent = total;
    });
}

/* ---------- Página de producto ---------- */

function updatePrice() {
    const select = document.getElementById('size');
    const priceEl = document.getElementById('product-price');
    if (!select || !priceEl) return;
    priceEl.textContent = select.selectedOptions[0].dataset.price;
}

function addToCart() {
    const card = document.querySelector('.product-card');
    const select = document.getElementById('size');
    const img = document.querySelector('.producto-detalle img');
    if (!card) return;

    // Si la página tiene selector de talla se usa; si no, se usa el data-price de la tarjeta
    const option = select ? select.selectedOptions[0] : null;
    const item = {
        id: card.dataset.id,
        name: card.dataset.name,
        size: option ? option.value : '',
        price: option ? parseFloat(option.dataset.price) : parseFloat(card.dataset.price),
        image: img ? img.getAttribute('src') : '',
        qty: 1
    };

    const cart = getCart();
    // Mismo producto + misma talla = suma cantidad; otra talla = línea nueva
    const existing = cart.find(i => i.id === item.id && i.size === item.size);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push(item);
    }
    saveCart(cart);
    showToast(item.name + (item.size ? ' (' + item.size + ')' : '') + ' agregado al carrito');
}

function buyNow() {
    addToCart();
    window.location.href = 'carrito.html';
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.setAttribute('role', 'status');
        toast.style.cssText =
            'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
            'background:#fff;color:#000;padding:12px 20px;border-radius:6px;' +
            'font-weight:700;font-size:14px;z-index:1000;transition:opacity .25s;opacity:0;';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

/* ---------- Página carrito.html ---------- */

function changeQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

function clearCart() {
    saveCart([]);
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items');
    if (!list) return; // no estamos en carrito.html

    const totalEl = document.getElementById('cart-total');
    const emptyEl = document.getElementById('cart-empty');
    const summaryEl = document.getElementById('cart-summary');
    const cart = getCart();

    list.innerHTML = '';
    emptyEl.hidden = cart.length > 0;
    summaryEl.hidden = cart.length === 0;

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;

        const row = document.createElement('li');
        row.className = 'cart-row';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;

        const info = document.createElement('div');
        info.className = 'cart-info';
        const name = document.createElement('strong');
        name.textContent = item.name;
        const meta = document.createElement('span');
        meta.textContent = (item.size ? 'Talla ' + item.size + ' · ' : '') + formatPrice(item.price);
        info.append(name, meta);

        const qty = document.createElement('div');
        qty.className = 'cart-qty';
        const minus = document.createElement('button');
        minus.textContent = '−';
        minus.setAttribute('aria-label', 'Quitar uno');
        minus.onclick = () => changeQty(index, -1);
        const count = document.createElement('span');
        count.textContent = item.qty;
        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.setAttribute('aria-label', 'Agregar uno');
        plus.onclick = () => changeQty(index, 1);
        qty.append(minus, count, plus);

        const sub = document.createElement('div');
        sub.className = 'cart-sub';
        sub.textContent = formatPrice(item.price * item.qty);

        const del = document.createElement('button');
        del.className = 'cart-remove';
        del.textContent = 'Eliminar';
        del.onclick = () => removeItem(index);

        row.append(img, info, qty, sub, del);
        list.appendChild(row);
    });

    totalEl.textContent = formatPrice(total);
}

/* ---------- Arranque ---------- */

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updatePrice();
    renderCart();
});

// Si el carrito cambia en otra pestaña, se actualiza aquí también
window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
        updateCartCount();
        renderCart();
    }
});
