/**
 * Lógica do Carrinho de Compras com Suporte a Múltiplas Páginas (localStorage)
 */

const STORAGE_KEY = 'gmAttelierCart';
const STORAGE_KEY_OPTIONS = 'gmAttelierCartOptions';
let cart = [];

const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total-value');
const checkoutButton = document.getElementById('checkout-btn');
const cartContainer = document.getElementById('cart-container');
const cartIcon = document.getElementById('cart-icon');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartCountElement = document.getElementById('cart-count');
const paymentMethodInputs = document.getElementsByName('payment-method');
const fulfillmentInputs = document.getElementsByName('fulfillment-type');
const deliveryAddressInput = document.getElementById('delivery-address');
const whatsappButton = document.getElementById('whatsapp-btn');

let cartOptions = {
    paymentMethod: 'pix',
    fulfillment: 'retirada',
    deliveryAddress: ''
};

const WHATSAPP_NUMBER = '5535998493844';

// --- Funções de Sincronização ---

function loadCart() {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (savedCart) cart = JSON.parse(savedCart);
}

function loadCartOptions() {
    const savedOptions = localStorage.getItem(STORAGE_KEY_OPTIONS);
    if (savedOptions) {
        const parsed = JSON.parse(savedOptions);
        cartOptions = Object.assign(cartOptions, parsed);
    }
}

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function saveCartOptions() {
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(cartOptions));
}

// --- Lógica do Carrinho ---

function addToCart(productId, name, price, image = '') {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, name, price, image, quantity: 1 });
    }
    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    if (existingItemIndex > -1) {
        if (cart[existingItemIndex].quantity > 1) {
            cart[existingItemIndex].quantity -= 1;
        } else {
            cart.splice(existingItemIndex, 1);
        }
    }
    saveCart();
    renderCart();
}

function renderCart() {
    if (!cartItemsContainer || !cartTotalElement) {
        let itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        if (cartCountElement) cartCountElement.textContent = itemCount.toString();
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">O carrinho está vazio.</p>';
        cartTotalElement.textContent = 'R$ 0,00';
    } else {
        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            total += itemSubtotal;
            itemCount += item.quantity;
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.innerHTML = `
                ${item.image ? `<img src="${item.image}" class="cart-item-image">` : ''}
                <div class="cart-item-details">
                    <p class="item-name">${item.name}</p>
                    <div class="item-controls">
                        <button class="quantity-btn decrement-btn" data-id="${item.id}">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increment-btn" data-id="${item.id}">+</button>
                    </div>
                    <p class="item-price">R$ ${itemSubtotal.toFixed(2).replace('.', ',')}</p>
                </div>`;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        document.querySelectorAll('.decrement-btn').forEach(btn => btn.onclick = (e) => removeFromCart(e.target.dataset.id));
        document.querySelectorAll('.increment-btn').forEach(btn => btn.onclick = (e) => {
            const item = cart.find(i => i.id === e.target.dataset.id);
            if (item) addToCart(item.id, item.name, item.price, item.image);
        });
    }
    cartTotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (cartCountElement) cartCountElement.textContent = itemCount.toString();
}

// --- WhatsApp e Checkout ---

function sendWhatsApp() {
    if (cart.length === 0) {
        alert("Carrinho vazio!");
        return;
    }
    
    let message = 'FAVOR ENVIAR PRINT DO PRODUTO SOLICITADO!!!\n\nOlá, gostaria de fazer um pedido:\n';
    cart.forEach(item => {
        message += `• ${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
    });
    message += `\nTotal: ${cartTotalElement.textContent}\n`;
    message += `Pagamento: ${cartOptions.paymentMethod}\n`;
    message += `${cartOptions.fulfillment === 'entrega' ? ('Entrega: ' + (cartOptions.deliveryAddress || 'Não informado')) : 'Retirada no local'}`;

    const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '');
    window.location.href = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

// Vinculando o botão de WhatsApp do carrinho
if (whatsappButton) {
    whatsappButton.addEventListener('click', sendWhatsApp);
}

// --- Outros Eventos ---

if (cartIcon && cartContainer && closeCartBtn) {
    cartIcon.onclick = () => cartContainer.classList.add('open');
    closeCartBtn.onclick = () => cartContainer.classList.remove('open');
}

function updateDeliveryVisibility() {
    const wrapper = document.getElementById('delivery-address-wrapper');
    if (wrapper) wrapper.style.display = (cartOptions.fulfillment === 'entrega') ? 'block' : 'none';
}

function initCartOptionsListeners() {
    Array.from(paymentMethodInputs).forEach(input => {
        input.checked = (input.value === cartOptions.paymentMethod);
        input.onchange = (e) => { cartOptions.paymentMethod = e.target.value; saveCartOptions(); };
    });
    Array.from(fulfillmentInputs).forEach(input => {
        input.checked = (input.value === cartOptions.fulfillment);
        input.onchange = (e) => { 
            cartOptions.fulfillment = e.target.value; 
            saveCartOptions(); 
            updateDeliveryVisibility(); 
        };
    });
    if (deliveryAddressInput) {
        deliveryAddressInput.oninput = (e) => { cartOptions.deliveryAddress = e.target.value; saveCartOptions(); };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadCartOptions();
    renderCart();
    initCartOptionsListeners();
    updateDeliveryVisibility();

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('.store-product-card');
            const productId = productCard.dataset.productId;
            const productName = productCard.querySelector('.store-product-name').textContent;
            const productPrice = parseFloat(productCard.dataset.productPrice);
            const productImage = productCard.querySelector('.store-product-image').src;
            addToCart(productId, productName, productPrice, productImage);
            alert(`✅ "${productName}" adicionado!`);
            if (cartContainer) cartContainer.classList.add('open');
        });
    });
});
