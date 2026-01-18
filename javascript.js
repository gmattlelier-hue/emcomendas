/**
 * Lógica do Carrinho de Compras - GM Attelier (Versão Corrigida)
 */

const STORAGE_KEY = 'gmAttelierCart';
const STORAGE_KEY_OPTIONS = 'gmAttelierCartOptions';
const WHATSAPP_NUMBER = '5535998493844';

let cart = [];
let cartOptions = {
    paymentMethod: 'pix',
    fulfillment: 'retirada',
    deliveryAddress: ''
};

// Seletores
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total-value');
const cartContainer = document.getElementById('cart-container');
const cartIcon = document.getElementById('cart-icon');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartCountElement = document.getElementById('cart-count');
const deliveryAddressInput = document.getElementById('delivery-address');

// --- Sincronização ---
function loadCart() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) cart = JSON.parse(saved);
}

function loadCartOptions() {
    const saved = localStorage.getItem(STORAGE_KEY_OPTIONS);
    if (saved) cartOptions = Object.assign(cartOptions, JSON.parse(saved));
}

function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
function saveCartOptions() { localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(cartOptions)); }

// --- Lógica do Carrinho ---
function addToCart(productId, name, price, image = '') {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: productId, name, price, image, quantity: 1 });
    }
    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    const idx = cart.findIndex(item => item.id === productId);
    if (idx > -1) {
        if (cart[idx].quantity > 1) cart[idx].quantity -= 1;
        else cart.splice(idx, 1);
    }
    saveCart();
    renderCart();
}

function renderCart() {
    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">O carrinho está vazio.</p>';
        cartTotalElement.textContent = 'R$ 0,00';
    } else {
        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            count += item.quantity;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                ${item.image ? `<img src="${item.image}" class="cart-item-image">` : ''}
                <div class="cart-item-details">
                    <p class="item-name">${item.name}</p>
                    <div class="item-controls">
                        <button class="quantity-btn" onclick="removeFromCart('${item.id}')">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="addToCart('${item.id}', '${item.name}', ${item.price}, '${item.image}')">+</button>
                    </div>
                    <p class="item-price">R$ ${subtotal.toFixed(2).replace('.', ',')}</p>
                </div>`;
            cartItemsContainer.appendChild(div);
        });
    }
    cartTotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (cartCountElement) cartCountElement.textContent = count.toString();
}

// --- Funções de Interface ---
function updateDeliveryVisibility() {
    const wrapper = document.getElementById('delivery-address-wrapper');
    if (wrapper) wrapper.style.display = (cartOptions.fulfillment === 'entrega') ? 'block' : 'none';
}

// --- ENVIO WHATSAPP (AQUI ESTAVA O ERRO) ---
function handleWhatsAppClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '');
    let message = 'FAVOR ENVIAR PRINT DO PEDIDO!!!\n\nOlá, gostaria de fazer um pedido:\n\n';
    
    cart.forEach(item => {
        message += `• ${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
    });

    message += `\nTotal: ${cartTotalElement.textContent}`;
    message += `\nPagamento: ${cartOptions.paymentMethod.toUpperCase()}`;
    message += `\n${cartOptions.fulfillment === 'entrega' ? 'Entrega: ' + (cartOptions.deliveryAddress || 'Não informado') : 'Retirada no local'}`;

    const url = "https://wa.me/" + cleanNumber + "?text=" + encodeURIComponent(message);
    
    // Redireciona para o WhatsApp
    window.location.assign(url);
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadCartOptions();
    renderCart();
    updateDeliveryVisibility();

    // Configurar o botão de envio (Novo ID que sugerimos)
    const whatsappButton = document.getElementById('btn-enviar-wa') || document.getElementById('whatsapp-btn');
    if (whatsappButton) {
        whatsappButton.onclick = handleWhatsAppClick;
    }

    // Abrir/Fechar Carrinho
    if (cartIcon) cartIcon.onclick = (e) => { e.preventDefault(); cartContainer.classList.add('open'); };
    if (closeCartBtn) closeCartBtn.onclick = () => cartContainer.classList.remove('open');

    // Opções de Pagamento e Entrega
    document.getElementsByName('payment-method').forEach(input => {
        input.checked = (input.value === cartOptions.paymentMethod);
        input.onchange = (e) => { cartOptions.paymentMethod = e.target.value; saveCartOptions(); };
    });

    document.getElementsByName('fulfillment-type').forEach(input => {
        input.checked = (input.value === cartOptions.fulfillment);
        input.onchange = (e) => { 
            cartOptions.fulfillment = e.target.value; 
            saveCartOptions(); 
            updateDeliveryVisibility(); 
        };
    });

    if (deliveryAddressInput) {
        deliveryAddressInput.value = cartOptions.deliveryAddress;
        deliveryAddressInput.oninput = (e) => { cartOptions.deliveryAddress = e.target.value; saveCartOptions(); };
    }

    // Botões "Adicionar ao Carrinho" da Loja
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.onclick = (event) => {
            const productCard = event.target.closest('.store-product-card');
            const productId = productCard.dataset.productId;
            const productName = productCard.querySelector('.store-product-name').textContent;
            const productPrice = parseFloat(productCard.dataset.productPrice);
            const productImage = productCard.querySelector('.store-product-image').src;
            
            addToCart(productId, productName, productPrice, productImage);
            alert(`✅ "${productName}" adicionado!`);
            if (cartContainer) cartContainer.classList.add('open');
        };
    });
});
