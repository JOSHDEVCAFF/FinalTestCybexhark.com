(() => {
    const CART_KEY = 'cybexharkFramesetCart';
    const ORDER_HISTORY_KEY = 'cybexharkFramesetOrders';
    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const errorBanner = document.createElement('p');
    let cart = [];

    errorBanner.className = 'cart-error';
    errorBanner.setAttribute('role', 'alert');
    errorBanner.hidden = true;
    document.querySelector('.site-header')?.after(errorBanner);

    function showError(message, error) {
        console.error(message, error);
        errorBanner.textContent = message;
        errorBanner.hidden = false;
    }

    function loadCart() {
        try {
            const savedCart = localStorage.getItem(CART_KEY);
            if (!savedCart) return [];

            const parsedCart = JSON.parse(savedCart);
            if (!Array.isArray(parsedCart)) {
                throw new TypeError('Saved cart data is not a list.');
            }

            const validCart = parsedCart.every(item =>
                item &&
                typeof item.title === 'string' &&
                Number.isFinite(Number(item.price)) &&
                Number.isInteger(Number(item.quantity)) &&
                Number(item.quantity) > 0 &&
                Number(item.quantity) <= 99 &&
                typeof item.image === 'string'
            );
            if (!validCart) throw new TypeError('Saved cart contains an invalid item.');
            return parsedCart;
        } catch (error) {
            showError('Your saved cart could not be read. You can start a new cart by adding an item.', error);
            return [];
        }
    }

    function saveCart() {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            errorBanner.hidden = true;
            return true;
        } catch (error) {
            showError('Your browser could not save the cart. Check your browser storage settings and try again.', error);
            return false;
        }
    }

    function itemCount() {
        return cart.reduce((total, item) => total + Number(item.quantity), 0);
    }

    function cartTotal() {
        return cart.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
    }

    function loadOrderHistory() {
        try {
            const savedOrders = localStorage.getItem(ORDER_HISTORY_KEY);
            if (!savedOrders) return [];

            const parsedOrders = JSON.parse(savedOrders);
            if (!Array.isArray(parsedOrders)) {
                throw new TypeError('Saved order history is not a list.');
            }
            const validOrders = parsedOrders.every(order =>
                order &&
                typeof order.id === 'string' &&
                typeof order.createdAt === 'string' &&
                Number.isFinite(Date.parse(order.createdAt)) &&
                order.status === 'Preview only' &&
                typeof order.paymentMethod === 'string' &&
                Array.isArray(order.items) &&
                order.items.length > 0 &&
                order.items.every(item =>
                    item &&
                    typeof item.title === 'string' &&
                    Number.isFinite(Number(item.price)) &&
                    Number.isInteger(Number(item.quantity)) &&
                    Number(item.quantity) > 0 &&
                    typeof item.image === 'string'
                ) &&
                Number.isFinite(Number(order.subtotal)) &&
                Number.isFinite(Number(order.shipping)) &&
                Number.isFinite(Number(order.total))
            );
            if (!validOrders) throw new TypeError('Saved order history contains an invalid order.');
            return parsedOrders;
        } catch (error) {
            showError('Your saved order history could not be read. Check your browser storage and try again.', error);
            return null;
        }
    }

    function saveOrderPreview() {
        const orderHistory = loadOrderHistory();
        if (!orderHistory) return null;

        const order = {
            id: `CY-${Date.now().toString(36).toUpperCase()}`,
            createdAt: new Date().toISOString(),
            status: 'Preview only',
            paymentMethod: document.querySelector('input[name="payment-method"]:checked')?.value || 'Not selected',
            items: cart.map(item => ({
                title: item.title,
                price: Number(item.price),
                quantity: Number(item.quantity),
                image: item.image
            })),
            subtotal: cartTotal(),
            shipping: 0,
            total: cartTotal()
        };

        try {
            orderHistory.unshift(order);
            localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orderHistory));
            errorBanner.hidden = true;
            return order;
        } catch (error) {
            showError('Your browser could not save this order preview. Check your browser storage and try again.', error);
            return null;
        }
    }

    function renderOrderHistory() {
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) return;

        const ordersEmpty = document.getElementById('orders-empty');
        const orderHistory = loadOrderHistory();
        if (!orderHistory) {
            ordersEmpty.hidden = false;
            ordersEmpty.querySelector('p').textContent = 'Your order history could not be loaded. Check the message above and try again.';
            return;
        }

        const sortedOrders = orderHistory.slice().sort((left, right) =>
            new Date(right.createdAt) - new Date(left.createdAt)
        );
        ordersList.replaceChildren();
        ordersEmpty.hidden = sortedOrders.length > 0;
        document.getElementById('orders-count').textContent = String(sortedOrders.length);
        document.getElementById('orders-total').textContent = currency.format(
            sortedOrders.reduce((total, order) => total + Number(order.total), 0)
        );

        sortedOrders.forEach(order => {
            const card = makeElement('article', 'saved-order');
            const header = makeElement('header', 'saved-order-header');
            const identity = makeElement('div');
            identity.append(
                makeElement('h3', 'saved-order-id', `Order ${order.id}`),
                makeElement('p', 'saved-order-date', `Saved ${new Date(order.createdAt).toLocaleString()} on this browser`)
            );
            header.append(identity, makeElement('span', 'saved-order-status', 'Preview only'));
            card.append(header);

            const tracking = makeElement('div', 'saved-order-tracking');
            tracking.append(
                makeElement('span', 'tracking-label', 'Tracking status'),
                makeElement('strong', '', 'Demo preview saved'),
                makeElement('p', '', 'This is not a real shipment. Live carrier and delivery updates are not available.')
            );
            card.append(tracking);

            const items = makeElement('div', 'saved-order-items');
            order.items.forEach(item => {
                const row = makeElement('div', 'saved-order-item');
                const thumbnail = makeElement('div', 'saved-order-thumb');
                const image = makeElement('img');
                image.src = item.image;
                image.alt = '';
                image.loading = 'lazy';
                thumbnail.append(image);

                const description = makeElement('div', 'saved-order-description');
                description.append(
                    makeElement('h4', '', item.title),
                    makeElement('p', '', `${item.quantity} × ${currency.format(item.price)} each`)
                );
                row.append(
                    thumbnail,
                    description,
                    makeElement('strong', 'saved-order-line-total', currency.format(item.price * item.quantity))
                );
                items.append(row);
            });
            card.append(items);

            const totals = makeElement('div', 'saved-order-totals');
            const subtotal = makeElement('div', 'saved-order-total-line');
            subtotal.append(makeElement('span', '', 'Subtotal'), makeElement('strong', '', currency.format(order.subtotal)));
            const shipping = makeElement('div', 'saved-order-total-line');
            shipping.append(makeElement('span', '', 'Shipping'), makeElement('strong', 'free-shipping', 'FREE'));
            const total = makeElement('div', 'saved-order-grand-total');
            total.append(makeElement('span', '', 'Order total'), makeElement('strong', '', currency.format(order.total)));
            totals.append(subtotal, shipping, total);
            card.append(totals);

            const payment = makeElement('p', 'saved-order-payment', `Payment option preview: ${order.paymentMethod || 'Not selected'}`);
            card.append(payment);
            ordersList.append(card);
        });
    }

    function renderOrderConfirmation() {
        const confirmationTotal = document.getElementById('confirmation-total');
        if (!confirmationTotal) return;

        const orderHistory = loadOrderHistory();
        const requestedOrderId = new URLSearchParams(window.location.search).get('order');
        const order = orderHistory?.find(savedOrder => savedOrder.id === requestedOrderId)
            || (!requestedOrderId ? orderHistory?.[0] : null);
        const confirmationId = document.getElementById('confirmation-id');
        const confirmationMessage = document.getElementById('confirmation-message');

        if (order) {
            confirmationTotal.textContent = currency.format(order.total);
            if (confirmationId) confirmationId.textContent = `Order reference: ${order.id}`;
            if (confirmationMessage) {
                confirmationMessage.textContent = 'This order preview is saved in this browser. No payment was processed and no shipment was scheduled.';
            }
        } else {
            confirmationTotal.textContent = '—';
            if (confirmationId) confirmationId.textContent = '';
            if (confirmationMessage) {
                confirmationMessage.textContent = 'No saved order preview was found. No order was submitted and no payment was processed.';
            }
        }
    }

    function updateCartBadges() {
        document.querySelectorAll('.cart-count').forEach(badge => {
            badge.textContent = String(itemCount());
        });
    }

    function setupResponsiveNavigation() {
        const header = document.querySelector('.site-header');
        const navigation = document.querySelector('.side-nav');
        if (!header || !navigation) return;

        navigation.id = 'store-navigation';
        navigation.setAttribute('aria-hidden', 'false');

        const menuButton = makeElement('button', 'mobile-menu-toggle');
        menuButton.type = 'button';
        menuButton.setAttribute('aria-controls', navigation.id);
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open navigation menu');
        menuButton.innerHTML = '<span class="menu-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span><span class="menu-toggle-label"></span>';
        header.insertBefore(menuButton, header.firstElementChild);

        const backdrop = makeElement('button', 'nav-backdrop');
        backdrop.type = 'button';
        backdrop.setAttribute('aria-label', 'Close navigation menu');
        backdrop.hidden = true;
        navigation.after(backdrop);

        const mobileQuery = window.matchMedia('(max-width: 700px)');

        function closeMenu(restoreFocus = false) {
            navigation.classList.remove('is-open');
            navigation.setAttribute('aria-hidden', 'true');
            navigation.inert = true;
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.setAttribute('aria-label', 'Open navigation menu');
            backdrop.hidden = true;
            document.body.classList.remove('store-menu-open');
            if (restoreFocus) menuButton.focus();
        }

        function openMenu() {
            navigation.inert = false;
            navigation.setAttribute('aria-hidden', 'false');
            navigation.classList.add('is-open');
            menuButton.setAttribute('aria-expanded', 'true');
            menuButton.setAttribute('aria-label', 'Close navigation menu');
            backdrop.hidden = false;
            document.body.classList.add('store-menu-open');
            navigation.querySelector('.nav-link')?.focus();
        }

        function syncNavigationToViewport() {
            if (mobileQuery.matches) {
                closeMenu();
            } else {
                navigation.classList.remove('is-open');
                navigation.inert = false;
                navigation.setAttribute('aria-hidden', 'false');
                menuButton.setAttribute('aria-expanded', 'false');
                menuButton.setAttribute('aria-label', 'Open navigation menu');
                backdrop.hidden = true;
                document.body.classList.remove('store-menu-open');
            }
        }

        menuButton.addEventListener('click', () => {
            if (menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
            else openMenu();
        });
        backdrop.addEventListener('click', () => closeMenu(true));
        navigation.addEventListener('click', event => {
            if (event.target.closest('a')) closeMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
                closeMenu(true);
            }
        });
        mobileQuery.addEventListener('change', syncNavigationToViewport);
        syncNavigationToViewport();
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function renderCheckout() {
        const cartItems = document.getElementById('cart-items');
        if (!cartItems) return;

        cartItems.replaceChildren();
        const emptyMessage = document.getElementById('empty-cart-message');
        emptyMessage.hidden = cart.length > 0;
        document.getElementById('item-count').textContent = `${itemCount()} ITEMS`;

        cart.forEach((item, index) => {
            const article = makeElement('article', 'order-item cart-item');
            const imageWrap = makeElement('div', 'order-thumb');
            const image = makeElement('img');
            image.src = item.image;
            image.alt = '';
            image.loading = 'lazy';
            imageWrap.append(image);

            const description = makeElement('div', 'order-description');
            description.append(
                makeElement('h3', '', item.title),
                makeElement('p', '', item.description || 'Training essential')
            );

            const controls = makeElement('div', 'quantity-control');
            const quantityLabel = makeElement('label', '', 'Qty');
            const quantity = makeElement('input', 'quantity');
            quantity.type = 'number';
            quantity.min = '1';
            quantity.max = '99';
            quantity.value = String(item.quantity);
            quantity.setAttribute('aria-label', `Quantity for ${item.title}`);
            quantity.dataset.index = String(index);
            quantityLabel.append(quantity);

            const remove = makeElement('button', 'remove-item', 'Remove');
            remove.type = 'button';
            remove.dataset.index = String(index);
            remove.setAttribute('aria-label', `Remove ${item.title} from cart`);
            controls.append(quantityLabel, remove);
            description.append(controls);

            article.append(imageWrap, description, makeElement('strong', '', currency.format(item.price * item.quantity)));
            cartItems.append(article);
        });

        const formattedTotal = currency.format(cartTotal());
        document.getElementById('cart-subtotal').textContent = formattedTotal;
        document.getElementById('cart-total').textContent = formattedTotal;

        const paymentLink = document.getElementById('continue-to-payment');
        paymentLink.setAttribute('aria-disabled', String(cart.length === 0));
        if (cart.length === 0) paymentLink.href = 'index.html#featured';
        else paymentLink.href = 'payment.html';
    }

    function renderPaymentSummary() {
        const count = document.getElementById('payment-item-count');
        if (!count) return;

        count.textContent = `${itemCount()} ${itemCount() === 1 ? 'item' : 'items'}`;
        const total = currency.format(cartTotal());
        document.getElementById('payment-total').textContent = total;
        document.getElementById('payment-subtotal').textContent = total;
        document.getElementById('payment-summary-total').textContent = total;

        if (cart.length === 0) {
            const warning = makeElement('p', 'demo-warning', 'Your cart is empty. Add an item before continuing to the payment preview.');
            document.querySelector('.payment-form').prepend(warning);
            document.querySelector('.payment-form button[type="submit"]').disabled = true;
        }
    }

    function addToCart(button) {
        const price = Number(button.dataset.price);
        if (!button.dataset.title || !Number.isFinite(price) || price < 0 || !button.dataset.image) {
            showError('This item could not be added because its product information is incomplete.');
            return;
        }

        const existingItem = cart.find(item => item.title === button.dataset.title);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                title: button.dataset.title,
                price,
                description: button.dataset.description || '',
                image: button.dataset.image,
                quantity: 1
            });
        }

        if (!saveCart()) return;

        updateCartBadges();
        button.disabled = true;
        button.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
        window.setTimeout(() => {
            button.disabled = false;
            button.innerHTML = 'Add to cart <span aria-hidden="true">+</span>';
        }, 800);
    }

    cart = loadCart();
    updateCartBadges();
    setupResponsiveNavigation();
    renderCheckout();
    renderPaymentSummary();

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => addToCart(button));
    });

    document.getElementById('cart-items')?.addEventListener('change', event => {
        if (!event.target.matches('.quantity')) return;
        const index = Number(event.target.dataset.index);
        const quantity = Number(event.target.value);
        if (!Number.isInteger(index) || !cart[index] || !Number.isFinite(quantity)) return;

        cart[index].quantity = Math.min(99, Math.max(1, Math.floor(quantity)));
        if (saveCart()) {
            updateCartBadges();
            renderCheckout();
        }
    });

    document.getElementById('cart-items')?.addEventListener('click', event => {
        const removeButton = event.target.closest('.remove-item');
        if (!removeButton) return;
        const index = Number(removeButton.dataset.index);
        if (!Number.isInteger(index) || !cart[index]) return;

        cart.splice(index, 1);
        if (saveCart()) {
            updateCartBadges();
            renderCheckout();
        }
    });

    document.querySelector('.payment-form')?.addEventListener('submit', event => {
        event.preventDefault();
        if (cart.length === 0) {
            showError('Your cart is empty. Add an item before continuing.');
            return;
        }

        const order = saveOrderPreview();
        if (!order) return;

        window.location.href = `order-complete.html?order=${encodeURIComponent(order.id)}`;
    });

    document.querySelectorAll('input[name="payment-method"]').forEach(method => {
        method.addEventListener('change', () => {
            const note = document.getElementById('payment-preview-note');
            if (!note) return;
            const paymentName = {
                card: 'Card payment',
                gcash: 'GCash',
                maya: 'Maya'
            }[method.value];
            note.textContent = `${paymentName} is shown as a preview only. This page does not accept or process payment details.`;
        });
    });

    document.getElementById('contact-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const subject = String(formData.get('subject') || '').trim();
        const message = String(formData.get('message') || '').trim();
        const status = document.getElementById('contact-status');

        status.textContent = 'Opening your email application. Review the draft there, then choose Send.';
        const mailto = new URL('mailto:joshscz123@gmail.com');
        mailto.searchParams.set('subject', `[Cybexhark] ${subject}`);
        mailto.searchParams.set('body', `Name: ${name}\nEmail: ${email}\n\n${message}`);
        window.location.href = mailto.toString();
    });

    renderOrderHistory();
    renderOrderConfirmation();
})();
