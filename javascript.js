/**
 * Lógica do Carrinho de Compras com Suporte a Múltiplas Páginas (localStorage)
 */

// Chave que será usada para salvar e carregar os dados no navegador
const STORAGE_KEY = 'gmAttelierCart';

// Armazenamento global para os itens do carrinho
let cart = [];

// Seletores do DOM
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total-value');
const checkoutButton = document.getElementById('checkout-btn');
const cartContainer = document.getElementById('cart-container');
const cartIcon = document.getElementById('cart-icon');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartCountElement = document.getElementById('cart-count');
// New localStorage key for cart options (payment/fulfillment)
const STORAGE_KEY_OPTIONS = 'gmAttelierCartOptions';
// New UI elements
const paymentMethodInputs = document.getElementsByName('payment-method');
const fulfillmentInputs = document.getElementsByName('fulfillment-type');
const deliveryAddressInput = document.getElementById('delivery-address');
const whatsappButton = document.getElementById('whatsapp-btn');

// Default options state for payment / fulfillment
let cartOptions = {
    paymentMethod: 'pix',
    fulfillment: 'retirada',
    deliveryAddress: ''
};
// WhatsApp number for checkout — provided by user
const WHATSAPP_NUMBER = '5535998493844';


// --- Funções de Sincronização de Dados ---

// 1. Carrega o carrinho salvo no navegador
function loadCart() {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (savedCart) {
        // Converte a string JSON salva de volta para um array JavaScript
        cart = JSON.parse(savedCart);
    }
}

function loadCartOptions() {
    const savedOptions = localStorage.getItem(STORAGE_KEY_OPTIONS);
    if (savedOptions) {
        const parsed = JSON.parse(savedOptions);
        cartOptions = Object.assign(cartOptions, parsed);
    }
}

// 2. Salva o carrinho no navegador
function saveCart() {
    // Converte o array JavaScript para uma string JSON e salva
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function saveCartOptions() {
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(cartOptions));
}

// --- Funções de Lógica do Carrinho ---

function addToCart(productId, name, price, image = '') {
    // Não precisa de loadCart() e saveCart() aqui, pois o evento de clique/renderização já cuida disso.

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }

    saveCart(); // Salva a mudança
    renderCart();
}

function removeFromCart(productId) {
    // Não precisa de loadCart() e saveCart() aqui, pois o evento de clique/renderização já cuida disso.
    
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex > -1) {
        const existingItem = cart[existingItemIndex];
        
        if (existingItem.quantity > 1) {
            existingItem.quantity -= 1;
        } else {
            // Remove completamente se a quantidade for 1
            cart.splice(existingItemIndex, 1);
        }
    }
    
    saveCart(); // Salva a mudança
    renderCart();
}

// --- Funções de Renderização (Exibição) ---

// Esta função só deve rodar se os elementos do carrinho existirem na página (ou seja, index.html)
function renderCart() {
    // Verifica se os seletores existem na página atual (para evitar erros em outras páginas)
    if (!cartItemsContainer || !cartTotalElement) {
        // Apenas atualiza o contador de itens em outras páginas, se o elemento existir
        let itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = itemCount.toString();
        }
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
            
            const imageHtml = item.image ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">` : '';
            
            cartItemDiv.innerHTML = `
                ${imageHtml}
                <div class="cart-item-details">
                    <p class="item-name">${item.name}</p>
                    <div class="item-controls">
                        <button class="quantity-btn decrement-btn" data-id="${item.id}">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increment-btn" data-id="${item.id}">+</button>
                    </div>
                    <p class="item-price">R$ ${itemSubtotal.toFixed(2).replace('.', ',')}</p>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItemDiv);
        });

        // Adiciona listeners para os botões de controle de quantidade
        document.querySelectorAll('.decrement-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.id;
                removeFromCart(productId); // Decrementa ou remove
            });
        });
        
        document.querySelectorAll('.increment-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.id;
                // Busca o item no carrinho para obter nome e preço para o addToCart
                const item = cart.find(i => i.id === productId);
                
                if (item) {
                    addToCart(item.id, item.name, item.price, item.image);
                }
            });
        });
    }

    // Atualiza o total
    cartTotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    // Atualiza o contador de itens no ícone
    if (cartCountElement) {
        cartCountElement.textContent = itemCount.toString();
    }
}

// --- Event Listeners ---

// 1. Ouve os cliques nos botões 'Comprar' (adiciona ao carrinho) - será adicionado no DOMContentLoaded

// 2. Ouve o clique no botão 'Finalizar Compra'
if (checkoutButton) {
    checkoutButton.addEventListener('click', async () => {
        if (cart.length === 0) {
            alert("Seu carrinho está vazio. Adicione itens antes de finalizar a compra!");
            return;
        }

        const totalText = cartTotalElement.textContent;
        const paymentMethod = cartOptions.paymentMethod;
        const fulfillment = cartOptions.fulfillment;
        const address = cartOptions.deliveryAddress || '';
        alert(`🎉 Compra Finalizada!\nTotal a Pagar: ${totalText}\nMétodo: ${paymentMethod}\n${fulfillment === 'entrega' ? 'Entrega — endereço: ' + address : 'Retirada no local'}\n\nO carrinho será esvaziado.`);

        // Captura a imagem do carrinho
        let cartImageData = null;
        try {
            const cartElement = document.querySelector('.cart-sidebar');
            if (cartElement && window.html2canvas) {
                const canvas = await html2canvas(cartElement, { 
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true
                });
                cartImageData = canvas.toDataURL('image/png');
                
                // Fazer download automático da imagem
                const link = document.createElement('a');
                link.href = cartImageData;
                link.download = `pedido-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Mostrar popup com instruções
                const popupWindow = window.open('', 'cartScreenshot', 'width=500,height=700');
                popupWindow.document.write(`
                    <html>
                    <head>
                        <title>Seu Pedido</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
                            img { max-width: 100%; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                            .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                            h2 { color: #25D366; margin-bottom: 10px; }
                            p { font-size: 14px; color: #666; margin: 10px 0; }
                            .steps { text-align: left; background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; }
                            .steps ol { margin: 10px 0; padding-left: 20px; }
                            .steps li { margin: 8px 0; font-size: 14px; }
                            button { background: #25D366; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin: 10px 5px; font-weight: bold; }
                            button:hover { background: #1fa857; }
                            .note { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; text-align: left; border-radius: 4px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>✅ Pedido Capturado!</h2>
                            <img src="${cartImageData}" alt="Seu Pedido" />
                            
                            <div class="note">
                                <strong>📸 Imagem Baixada:</strong> A imagem do seu pedido foi salva automaticamente. Você pode encontrá-la em seus Downloads.
                            </div>
                            
                            <div class="steps">
                                <strong>📱 Como Enviar pelo WhatsApp:</strong>
                                <ol>
                                    <li>Clique no botão "Abrir WhatsApp" abaixo</li>
                                    <li>Selecione a conversa com "GM Attelier"</li>
                                    <li>Clique no ícone de anexo (+)</li>
                                    <li>Selecione "Fotos e vídeos"</li>
                                    <li>Escolha a imagem baixada (pedido-*.png)</li>
                                    <li>Envie junto com sua mensagem</li>
                                </ol>
                            </div>
                            
                            <button onclick="window.open('https://wa.me/${WHATSAPP_NUMBER}', '_blank');">
                                📱 Abrir WhatsApp
                            </button>
                            <button onclick="window.close();">
                                ✕ Fechar
                            </button>
                        </div>
                    </body>
                    </html>
                `);
                popupWindow.document.close();
            }
        } catch (error) {
            console.warn('Não foi possível capturar a imagem do carrinho:', error);
            alert('⚠️ Não foi possível capturar a imagem, mas sua mensagem será enviada via WhatsApp.');
        }

        // Build WhatsApp message
        let message = `Olá! Gostaria de fazer um pedido:\n`;
        cart.forEach(item => {
            message += `${item.name} x ${item.quantity} - R$ ${ (item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
        });
        message += `Total: ${cartTotalElement.textContent}\n`;
        message += `Método de pagamento: ${cartOptions.paymentMethod}\n`;
        message += `${cartOptions.fulfillment === 'entrega' ? ('Entrega — ' + (cartOptions.deliveryAddress || 'Endereço não informado')) : 'Retirada no local'}\n`;

        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        // Open WhatsApp in a new tab for the user to confirm
        setTimeout(() => {
            window.open(waUrl, '_blank');
        }, 500);

        // Clear cart state after opening WhatsApp
        cart = [];
        saveCart();
        renderCart();
        if (cartContainer) cartContainer.classList.remove('open');
    });
}

// 3. Lógica para abrir/fechar a barra lateral
if (cartIcon && cartContainer && closeCartBtn) {
    // Abrir a barra lateral
    cartIcon.addEventListener('click', (event) => {
        event.preventDefault();
        cartContainer.classList.add('open');
    });

    // Fechar a barra lateral
    closeCartBtn.addEventListener('click', () => {
        cartContainer.classList.remove('open');
    });
}

// Show/hide delivery address input when fulfillment type changes
function updateDeliveryVisibility() {
    const wrapper = document.getElementById('delivery-address-wrapper');
    if (!wrapper) return;
    wrapper.style.display = (cartOptions.fulfillment === 'entrega') ? 'block' : 'none';
    if (!deliveryAddressInput) return;
    deliveryAddressInput.value = cartOptions.deliveryAddress || '';
}

// Init listeners for options (payment method, fulfillment, address)
function initCartOptionsListeners() {
    if (paymentMethodInputs) {
        Array.from(paymentMethodInputs).forEach(input => {
            input.checked = (input.value === cartOptions.paymentMethod);
            input.addEventListener('change', (event) => {
                cartOptions.paymentMethod = event.target.value;
                saveCartOptions();
            });
        });
    }

    if (fulfillmentInputs) {
        Array.from(fulfillmentInputs).forEach(input => {
            input.checked = (input.value === cartOptions.fulfillment);
            input.addEventListener('change', (event) => {
                cartOptions.fulfillment = event.target.value;
                saveCartOptions();
                updateDeliveryVisibility();
            });
        });
    }

    if (deliveryAddressInput) {
        deliveryAddressInput.addEventListener('input', (event) => {
            cartOptions.deliveryAddress = event.target.value;
            saveCartOptions();
        });
    }

    if (whatsappButton) {
        whatsappButton.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert('Seu carrinho está vazio. Adicione itens antes de enviar via WhatsApp.');
                return;
            }

           // 1. Garanta que o número tenha APENAS dígitos (remove +, - e espaços)
const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '');

let message = 'FAVOR ENVIAR PRINT DO PRODUTO SOLICITADO!!!\n\nOlá, gostaria de fazer um pedido:\n';

cart.forEach(item => {
    // Usando template string e garantindo a quebra de linha
    message += `${item.name} x ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
});

message += `\nTotal: ${cartTotalElement.textContent}\n`;
message += `Método de pagamento: ${cartOptions.paymentMethod}\n`;
message += `${cartOptions.fulfillment === 'entrega' ? ('Entrega — ' + (cartOptions.deliveryAddress || 'Endereço não informado')) : 'Retirada no local'}`;

// 2. Criar a URL usando o número limpo
const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

// 3. Redirecionar
window.location.href = url;
// 4. Inicializa: Carrega os dados e tenta renderizar se estiver na página correta
document.addEventListener('DOMContentLoaded', () => {
    loadCart(); // Carrega o carrinho em AMBAS as páginas
    loadCartOptions();
    renderCart(); // Tenta exibir e atualiza o contador em todas
    initCartOptionsListeners();
    updateDeliveryVisibility();
    
    // Adicionar event listeners dos botões de compra
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('.store-product-card');

            // Garante que a conversão de preço use ponto como separador decimal para o JS
            const priceString = productCard.dataset.productPrice; 
            
            const productId = productCard.dataset.productId;
            const productName = productCard.querySelector('.store-product-name').textContent;
            const productPrice = parseFloat(priceString);
            const productImage = productCard.querySelector('.store-product-image').src;
            
            addToCart(productId, productName, productPrice, productImage);

            // Alerta e tenta abrir o carrinho após adicionar, se os elementos existirem
            alert(`✅ "${productName}" adicionado!`);
            if (cartContainer) {
                cartContainer.classList.add('open');
            }
        });
    });
});
