

const CART_KEY = 'urbanvoid_cart';



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



function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('#cart-count').forEach(el => {
        el.textContent = total;
    });
}



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
    if (!card || !select) return;

    const option = select.selectedOptions[0];
    const item = {
        id: card.dataset.id,
        name: card.dataset.name,
        size: option.value,
        price: parseFloat(option.dataset.price),
        image: img ? img.getAttribute('src') : '',
        qty: 1
    };

    const cart = getCart();
 
    const existing = cart.find(i => i.id === item.id && i.size === item.size);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push(item);
    }
    saveCart(cart);
    showToast(item.name + ' (' + item.size + ') agregado al carrito');
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
        meta.textContent = 'Talla ' + item.size + ' · ' + formatPrice(item.price);
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
/* ---------- Pago simulado ---------- */

function openCheckout() {
    document.getElementById('checkout-total').textContent =
        document.getElementById('cart-total').textContent;
    document.getElementById('checkout').hidden = false;
}

function closeCheckout() {
    document.getElementById('checkout').hidden = true;
}

function initCheckout() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    // Formato automático: espacios cada 4 dígitos y "/" en la fecha
    form.tarjeta.addEventListener('input', () => {
        const d = form.tarjeta.value.replace(/\D/g, '').slice(0, 16);
        form.tarjeta.value = d.replace(/(.{4})/g, '$1 ').trim();
    });
    form.vence.addEventListener('input', () => {
        const d = form.vence.value.replace(/\D/g, '').slice(0, 4);
        form.vence.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const error = document.getElementById('checkout-error');
        const numero = form.tarjeta.value.replace(/\s/g, '');

        if (!form.nombre.value.trim()) return error.textContent = 'Escribe el nombre de la tarjeta.';
        if (!/^\d{16}$/.test(numero)) return error.textContent = 'El número debe tener 16 dígitos.';
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.vence.value)) return error.textContent = 'Fecha inválida (MM/AA).';
        if (!/^\d{3}$/.test(form.cvv.value)) return error.textContent = 'El CVV debe tener 3 dígitos.';
        error.textContent = '';

        const btn = document.getElementById('pay-btn');
        btn.disabled = true;
        btn.textContent = 'Procesando...';

        // Fingimos que el banco tarda un poco en responder
        setTimeout(() => {
            const pedido = 'UV-' + Math.floor(100000 + Math.random() * 900000);
            document.getElementById('checkout-box').innerHTML =
                '<h3>¡Pago aprobado!</h3>' +
                '<p style="margin:12px 0">Gracias por tu compra, ' + form.nombre.value.trim().split(' ')[0] + '.</p>' +
                '<p style="color:#aaa">Pedido <strong style="color:#fff">' + pedido + '</strong></p>' +
                '<div class="cart-buttons" style="margin-top:20px">' +
                '<a class="primary" href="../index.html">Volver a la tienda</a></div>';
            clearCart(); // vacía el carrito
        }, 1800);
    });
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
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updatePrice();
    renderCart();
    initCheckout();   // <-- nueva
});
