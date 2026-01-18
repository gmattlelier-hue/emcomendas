// --- Event Listeners ---

if (checkoutButton) {
    checkoutButton.addEventListener('click', async () => {
        if (cart.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        // Tenta capturar a imagem apenas para salvar no dispositivo do usuário
        try {
            const cartElement = document.querySelector('.cart-sidebar');
            if (cartElement && window.html2canvas) {
                const canvas = await html2canvas(cartElement, { 
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true
                });
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `pedido-${Date.now()}.png`;
                link.click();
            }
        } catch (error) {
            console.warn('Erro ao baixar imagem:', error);
        }

        // Montagem da mensagem de texto
        let message = `Olá! Gostaria de fazer um pedido:\n\n`;
        cart.forEach(item => {
            message += `• ${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
        });
        
        message += `\n*Total:* ${cartTotalElement.textContent}\n`;
        message += `*Pagamento:* ${cartOptions.paymentMethod.toUpperCase()}\n`;
        message += `*Tipo:* ${cartOptions.fulfillment === 'entrega' ? 'Entrega em: ' + cartOptions.deliveryAddress : 'Retirada no local'}\n`;

        // Envio para o WhatsApp
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        
        // No mobile, location.href é muito mais confiável que window.open
        window.location.href = waUrl;

        // Limpa o carrinho
        cart = [];
        saveCart();
        renderCart();
        if (cartContainer) cartContainer.classList.remove('open');
    });
}

// Lógica para abrir/fechar a barra lateral
if (cartIcon && cartContainer && closeCartBtn) {
    cartIcon.addEventListener('click', (event) => {
        event.preventDefault();
        cartContainer.classList.add('open');
    });
    closeCartBtn.addEventListener('click', () => {
        cartContainer.classList.remove('open');
    });
}

function updateDeliveryVisibility() {
    const wrapper = document.getElementById('delivery-address-wrapper');
    if (wrapper) {
        wrapper.style.display = (cartOptions.fulfillment === 'entrega') ? 'block' : 'none';
    }
    if (deliveryAddressInput) {
        deliveryAddressInput.value = cartOptions.deliveryAddress || '';
    }
}

function initCartOptionsListeners() {
    if (paymentMethodInputs) {
        Array.from(paymentMethodInputs).forEach(input => {
            input.checked = (input.value === cartOptions.paymentMethod);
            input.addEventListener('change', (e) => {
                cartOptions.paymentMethod = e.target.value;
                saveCartOptions();
            });
        });
    }

    if (fulfillmentInputs) {
        Array.from(fulfillmentInputs).forEach(input => {
            input.checked = (input.value === cartOptions.fulfillment);
            input.addEventListener('change', (e) => {
                cartOptions.fulfillment = e.target.value;
                saveCartOptions();
                updateDeliveryVisibility();
            });
        });
    }

    if (deliveryAddressInput) {
        deliveryAddressInput.addEventListener('input', (e) => {
            cartOptions.deliveryAddress = e.target.value;
            saveCartOptions();
        });
    }

    // Botão extra de WhatsApp (se houver na sua interface)
    if (whatsappButton) {
        whatsappButton.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Carrinho vazio!');
                return;
            }
            // Dispara o mesmo clique do botão de checkout para manter o padrão
            checkoutButton.click();
        });
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
            const priceString = productCard.dataset.productPrice; 
            const productId = productCard.dataset.productId;
            const productName = productCard.querySelector('.store-product-name').textContent;
            const productPrice = parseFloat(priceString);
            const productImage = productCard.querySelector('.store-product-image').src;
            
            addToCart(productId, productName, productPrice, productImage);
            alert(`✅ "${productName}" adicionado!`);
            if (cartContainer) cartContainer.classList.add('open');
        });
    });
});
