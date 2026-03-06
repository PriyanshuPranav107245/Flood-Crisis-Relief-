// Form DOM Elements
const donationForm = document.getElementById('donationForm');
const amountButtons = document.querySelectorAll('.amount-btn');
const customAmountInput = document.getElementById('customAmount');
const cardNumberInput = document.getElementById('cardNumber');
const expiryInput = document.getElementById('expiry');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Conversion helpers
const BASE_AMOUNTS = [25, 50, 100, 250, 500];
// rates used to convert USD amounts into each currency (1 USD = rate units of that currency)
const CONVERSION_RATES = {
    'USD': 1,
    'INR': 83,      // ~1 USD = 83 INR
    'EUR': 0.92,    // ~1 USD = 0.92 EUR
    'GBP': 0.78     // ~1 USD = 0.78 GBP
};

// Receiver's UPI ID (hidden from frontend)
const RECEIVER_UPI_ID = 'priyanshupranav8@okaxis';

let selectedAmount = null;

function loadDynamicContent() {
    // Load organization name and site info
    const orgName = localStorage.getItem('orgName') || 'Flood Crisis Relief';
    const siteTitle = localStorage.getItem('siteTitle') || 'Flood Crisis Relief - Donate Now';
    const siteTagline = localStorage.getItem('siteTagline') || 'Help us rebuild communities affected by devastating floods';
    document.querySelector('.logo').textContent = `🌊 ${orgName}`;
    document.title = siteTitle;
    document.querySelector('.tagline').textContent = siteTagline;

    // Load crisis information
    const crisisOverview = localStorage.getItem('crisisOverview');
    if (crisisOverview) {
        document.querySelector('.info-content p').textContent = crisisOverview;
    }

    // Load impact stats
    const familiesAffected = localStorage.getItem('familiesAffected') || '5,000+';
    const aidDistributed = localStorage.getItem('aidDistributed') || '$2.5M';

    const statCards = document.querySelectorAll('.stat-card h3');
    if (statCards.length >= 2) {
        statCards[0].textContent = familiesAffected;
        statCards[1].textContent = aidDistributed;
    }

    // Load contact information
    const contactEmail = localStorage.getItem('contactEmail') || 'donate@floodrelief.org';
    const contactPhone = localStorage.getItem('contactPhone') || '+1-800-RELIEF-1';
    const orgAddress = localStorage.getItem('orgAddress') || '';

    // Update footer contact info
    const footerLinks = document.querySelectorAll('.footer a');
    footerLinks.forEach(link => {
        if (link.textContent.includes('donate@')) {
            link.textContent = contactEmail;
            link.href = `mailto:${contactEmail}`;
        }
    });

    const footerParas = document.querySelectorAll('.footer p');
    footerParas.forEach(p => {
        if (p.textContent.includes('donate@')) {
            p.innerHTML = p.innerHTML.replace(/donate@floodrelief\.org/g, contactEmail);
        }
        if (p.textContent.includes('1-800-RELIEF-1')) {
            p.innerHTML = p.innerHTML.replace(/1-800-RELIEF-1/g, contactPhone);
        }
    });

    // Load social media links
    loadSocialMediaLinks();

    // Load donation settings
    const currency = localStorage.getItem('currency') || 'USD';
    const minDonation = parseFloat(localStorage.getItem('minDonation')) || 10;
    const maxDonation = parseFloat(localStorage.getItem('maxDonation')) || 10000;
    const taxInfo = localStorage.getItem('taxInfo');

    // Apply currency symbol
    updateCurrencyDisplay(currency);
    // update subtitle label
    const label = document.getElementById('currencyLabel');
    if (label) label.textContent = {'USD':'$','INR':'₹','EUR':'€','GBP':'£'}[currency] || '$';

    // sync user currency dropdown if present
    const userCur = document.getElementById('userCurrency');
    if (userCur) {
        userCur.value = currency;
    }

    // Apply donation limits
    applyDonationLimits(minDonation, maxDonation);

    // Update counter goal display (convert base USD goal to selected currency)
    const goalEl = document.getElementById('goalAmount');
    if (goalEl) {
        const base = parseFloat(localStorage.getItem('goalAmount')) || 500000;
        const rate = CONVERSION_RATES[currency] || 1;
        goalEl.textContent = `${symbol}${(base * rate).toLocaleString()}`;
    }

    // Display tax information if available
    if (taxInfo) {
        displayTaxInfo(taxInfo);
    }

    // Check maintenance mode
    const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
    if (maintenanceMode) {
        showMaintenanceMode();
    }

    // Load FAQ items
    loadFaqItems();

    // Load Impact items
    loadImpactItems();

    // Load and display donation counter if present
    if (typeof loadDonationCounter === 'function') {
        loadDonationCounter();
    }
}

function loadFaqItems() {
    const faqContainer = document.querySelector('.faq-container');
    const faqItems = JSON.parse(localStorage.getItem('faqItems')) || getDefaultFaqItems();
    faqContainer.innerHTML = '';
    faqItems.forEach(item => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.innerHTML = `
            <h3 class="faq-question">${item.question}</h3>
            <p class="faq-answer">${item.answer}</p>
        `;
        faqContainer.appendChild(faqItem);
    });
}

function loadSocialMediaLinks() {
    const socialLinks = {
        facebook: localStorage.getItem('facebookUrl'),
        twitter: localStorage.getItem('twitterUrl'),
        instagram: localStorage.getItem('instagramUrl'),
        linkedin: localStorage.getItem('linkedinUrl')
    };
    Object.keys(socialLinks).forEach(platform => {
        const url = socialLinks[platform];
        if (url) {
            const link = document.querySelector(`.footer a[href*="${platform}"]`);
            if (link) {
                link.href = url;
                link.style.display = 'inline-block';
            }
        }
    });
}

function updateCurrencyDisplay(currency) {
    const currencySymbols = {
        'USD': '$',
        'INR': '₹',
        'EUR': '€',
        'GBP': '£'
    };
    const symbol = currencySymbols[currency] || '$';

    // compute rate relative to USD
    const rate = CONVERSION_RATES[currency] || 1;

    document.querySelectorAll('.amount-btn').forEach((btn, idx) => {
        // convert based on base amounts
        const converted = (BASE_AMOUNTS[idx] * rate).toFixed(2);
        btn.dataset.amount = converted;
        btn.textContent = `${symbol}${converted}`;
    });

    const customInput = document.getElementById('customAmount');
    if (customInput) {
        customInput.placeholder = `Enter amount in ${currency}`;
    }
    const label = document.getElementById('currencyLabel');
    if (label) label.textContent = symbol;
}

function applyDonationLimits(minAmount, maxAmount) {
    const customInput = document.getElementById('customAmount');
    if (customInput) {
        customInput.min = minAmount;
        customInput.max = maxAmount;
    }
}

function displayTaxInfo(taxInfo) {
    let taxInfoElement = document.querySelector('.tax-info');
    if (!taxInfoElement) {
        const donationSection = document.querySelector('.donation-section');
        if (donationSection) {
            taxInfoElement = document.createElement('div');
            taxInfoElement.className = 'tax-info';
            donationSection.appendChild(taxInfoElement);
        }
    }
    if (taxInfoElement) {
        taxInfoElement.innerHTML = `<h4>Tax Benefits</h4><p>${taxInfo}</p>`;
    }
}

function showMaintenanceMode() {
    const maintenanceMessage = localStorage.getItem('maintenanceMessage') || 'Site is under maintenance. Please check back soon.';
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="maintenance-mode">
                <h1>🔧 Under Maintenance</h1>
                <p>${maintenanceMessage}</p>
            </div>
        `;
    }
    if (header) {
        header.style.pointerEvents = 'none';
        header.style.opacity = '0.7';
    }
}

function getDefaultFaqItems() {
    return [
        { question: "Where does my donation go?", answer: "100% of your donation goes directly to emergency relief efforts including food, clean water, shelter, and medical supplies for affected families. We maintain complete transparency about fund allocation and provide detailed reports to all donors." },
        { question: "Is my donation tax-deductible?", answer: "Yes! We are a registered 501(c)(3) nonprofit organization. You will receive a tax receipt for your donation via email within 24 hours, which you can use for tax deduction purposes." },
        { question: "Can I donate anonymously?", answer: "Yes, you can choose to make an anonymous donation during the checkout process. Just leave the donor information fields blank and provide only an email for tax receipts." }
    ];
}

function getDefaultImpactItems() {
    return [
        { amount: "$10", description: "Provides a family with safe drinking water for a week" },
        { amount: "$25", description: "Supplies emergency first-aid kits for 5 families" },
        { amount: "$50", description: "Provides shelter materials for one family" },
        { amount: "$100", description: "Funds a week of meals for 8 people" }
    ];
}

function loadDonationCounter() {
    const realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    const total = realDonations.reduce((sum, d) => sum + d.amount, 0);
    const currency = localStorage.getItem('currency') || 'USD';
    const currencySymbols = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£' };
    const sym = currencySymbols[currency] || '$';
    const rate = CONVERSION_RATES[currency] || 1;
    const goalEl = document.getElementById('goalAmount');
    if (goalEl) {
        const base = parseFloat(localStorage.getItem('goalAmount')) || 500000;
        goalEl.textContent = `${sym}${(base * rate).toLocaleString()}`;
    }
    const raisedEl = document.getElementById('raisedAmount');
    if (raisedEl) {
        // NOTE: donations are stored in their original value; converting may be inaccurate if currencies vary,
        // but for now we multiply total by rate to approximate display in selected currency
        raisedEl.textContent = `${sym}${(total * rate).toLocaleString()}`;
    }
    const donorCountEl = document.getElementById('donorCount');
    if (donorCountEl) {
        donorCountEl.textContent = new Set(realDonations.map(d => d.email || d.name)).size;
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    loadDynamicContent();
    const userCur = document.getElementById('userCurrency');
    if (userCur) {
        userCur.addEventListener('change', e => {
            const cur = e.target.value;
            // clear any previous selection so amounts are re‑chosen
            amountButtons.forEach(btn => btn.classList.remove('active'));
            selectedAmount = null;
            if (customAmountInput) customAmountInput.value = '';

            localStorage.setItem('currency', cur);
            updateCurrencyDisplay(cur);
            const label = document.getElementById('currencyLabel');
            if (label) label.textContent = {'USD':'$','INR':'₹','EUR':'€','GBP':'£'}[cur] || '$';
            if (typeof loadDonationCounter === 'function') loadDonationCounter();
        });
    }
    window.addEventListener('storage', function(e) {
        if (e.key === 'donations') {
            if (typeof loadDonationCounter === 'function') loadDonationCounter();
        }
        if (e.key === 'lastUpdate') {
            loadDynamicContent();
        }
    });
});

// Event handlers for amounts
amountButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        amountButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedAmount = parseFloat(button.dataset.amount);
        customAmountInput.value = '';
    });
});

customAmountInput.addEventListener('input', () => {
    if (customAmountInput.value) {
        amountButtons.forEach(btn => btn.classList.remove('active'));
        selectedAmount = parseFloat(customAmountInput.value);
    }
});

cardNumberInput?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = formattedValue;
});

expiryInput?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
});

const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
const cardPaymentSection = document.getElementById('cardPaymentSection');
const upiPaymentSection = document.getElementById('upiPaymentSection');
paymentMethodRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'card') {
            cardPaymentSection.style.display = 'block';
            upiPaymentSection.style.display = 'none';
            document.getElementById('cardName').required = true;
            document.getElementById('cardNumber').required = true;
            document.getElementById('expiry').required = true;
            document.getElementById('cvv').required = true;
            document.getElementById('upiId').required = false;
        } else {
            cardPaymentSection.style.display = 'none';
            upiPaymentSection.style.display = 'block';
            document.getElementById('cardName').required = false;
            document.getElementById('cardNumber').required = false;
            document.getElementById('expiry').required = false;
            document.getElementById('cvv').required = false;
            document.getElementById('upiId').required = false;
        }
    });
});

// Form submission with validation
function isValidEmail(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
function isValidCardNumber(num) {
    let digits=num.replace(/\s/g,'');
    return /^\d{13,19}$/.test(digits);
}
function isValidExpiry(exp) {
    if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return false;
    const [m,y]=exp.split('/').map(Number);
    const now=new Date();
    const thisMonth=now.getFullYear()%100*12 + now.getMonth();
    const expMonth=y*12 + (m-1);
    return expMonth>=thisMonth;
}
function isValidCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}
function isValidUPI(upi) {
    return /^[\w.-]+@[\w]+$/.test(upi);
}

donationForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    errorMessage.style.display='none';
    successMessage.style.display='none';
    let amount=selectedAmount||parseFloat(customAmountInput.value);
    if(!amount||amount<=0){ showError('Please select a donation amount.'); return; }
    const firstName=document.getElementById('firstName').value.trim();
    const lastName=document.getElementById('lastName').value.trim();
    const email=document.getElementById('email').value.trim();
    if(!isValidEmail(email)){ showError('Please enter a valid email address.'); return; }
    const paymentMethod=document.querySelector('input[name="paymentMethod"]:checked').value;
    if(paymentMethod==='card'){
        const cardName=document.getElementById('cardName').value.trim();
        const cardNumber=document.getElementById('cardNumber').value.trim();
        const expiry=document.getElementById('expiry').value.trim();
        const cvv=document.getElementById('cvv').value.trim();
        if(!cardName||!isValidCardNumber(cardNumber)||!isValidExpiry(expiry)||!isValidCVV(cvv)){
            showError('Please enter valid card details.'); return;
        }
    } else {
        const upiId=document.getElementById('upiId').value.trim();
        if(upiId && !isValidUPI(upiId)){ showError('Please enter a valid UPI ID.'); return; }
    }
    processPayment(amount,firstName,lastName,email,paymentMethod);
});

function showError(msg){
    errorMessage.textContent=msg;
    errorMessage.style.display='block';
}

function processPayment(amount, firstName, lastName, email, paymentMethod) {
    const submitBtn = donationForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    setTimeout(() => {
        donationForm.style.display = 'none';
        successMessage.style.display = 'block';
        const currency = localStorage.getItem('currency') || 'USD';
        const currencySymbols = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£' };
        const symbol = currencySymbols[currency] || '$';
        document.getElementById('donationAmount').textContent = `${symbol}${amount.toFixed(2)}`;
        const successHeading = successMessage.querySelector('h3');
        const successText = successMessage.querySelector('p');
        if (paymentMethod === 'upi') {
            const upiId = document.getElementById('upiId').value.trim();
            let upiMessage = '';
            if (upiId) {
                upiMessage = `Payment instructions have been sent to <strong>${email}</strong>. Please send your donation to <strong>${upiId}</strong>.`;
            } else {
                upiMessage = `Please scan the QR code in your UPI app to complete the payment. A confirmation email will be sent to <strong>${email}</strong>.`;
            }
            successHeading.textContent = 'Thank You!';
            successText.innerHTML = `Your donation of <strong>${symbol}${amount.toFixed(2)}</strong> is being processed. ${upiMessage}<br><br>After payment, please send the confirmation screenshot to <strong>donate@floodrelief.org</strong> for your tax receipt.`;
        } else {
            successHeading.textContent = 'Thank You!';
            successText.innerHTML = `Your donation of <strong>${symbol}${amount.toFixed(2)}</strong> has been received. A confirmation email will be sent to you shortly.`;
        }
    }, 1000);
}
