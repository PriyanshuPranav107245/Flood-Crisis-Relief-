// Admin Dashboard Script

// Check if user is logged in
if (localStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
}

// Set admin name
document.getElementById('adminName').textContent = localStorage.getItem('adminName') || 'Admin';

// Mock Data (In real app, this would come from a backend)
let donations = [
    { id: 1, name: 'John Doe', email: 'john@example.com', amount: 100, method: 'card', type: 'one-time', date: '2026-02-17' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', amount: 50, method: 'upi', type: 'one-time', date: '2026-02-17' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', amount: 250, method: 'card', type: 'monthly', date: '2026-02-16' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', amount: 75, method: 'upi', type: 'one-time', date: '2026-02-16' },
];

let confirmations = [
    { id: 1, donor: 'Jane Smith', email: 'jane@example.com', amount: 50, upiId: 'jane@okaxis', screenshot: 'pending', status: 'pending', date: '2026-02-17' },
    { id: 2, donor: 'Alice Williams', email: 'alice@example.com', amount: 75, upiId: 'alice@ybl', screenshot: 'pending', status: 'pending', date: '2026-02-16' },
];

let campaigns = [
    { id: 1, name: 'Emergency Water Supply', goal: 50000, raised: 25000 },
    { id: 2, name: 'Shelter & Relief Materials', goal: 100000, raised: 65000 },
    { id: 3, name: 'Medical Supplies', goal: 75000, raised: 42000 },
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setupEventListeners();
    loadContent(); // Load editable content
    loadSettings(); // Load saved settings
    
    // Listen for real-time donation updates from other tabs/windows
    window.addEventListener('storage', function(e) {
        if (e.key === 'donations') {
            // Update dashboard when donations change in another tab
            loadDashboard();
            // Also refresh any open donation-related tabs
            if (document.getElementById('donations-tab').classList.contains('active')) {
                loadDonations();
            }
            if (document.getElementById('confirmations-tab').classList.contains('active')) {
                loadConfirmations();
            }
        }
    });
});

function setupEventListeners() {
    // Donation search and filter
    document.getElementById('donationSearch')?.addEventListener('input', filterDonations);
    document.getElementById('donationFilter')?.addEventListener('change', filterDonations);
    
    // Donor search
    document.getElementById('donorSearch')?.addEventListener('input', searchDonors);
    
    // Confirmation filter
    document.getElementById('confirmationFilter')?.addEventListener('change', loadConfirmations);
    
    // Campaign form
    document.getElementById('campaignForm')?.addEventListener('submit', createCampaign);
}

// Load Dashboard Tab
function loadDashboard() {
    // Get real donation data from localStorage
    const realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    const realConfirmations = JSON.parse(localStorage.getItem('confirmations')) || [];
    
    // Calculate statistics
    const totalDonations = realDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonors = new Set(realDonations.map(d => d.email || d.name)).size;
    const pendingCount = realConfirmations.filter(c => c.status === 'pending').length;
    const confirmedCount = realConfirmations.filter(c => c.status === 'confirmed').length;
    const successRate = confirmedCount + realDonations.filter(d => d.paymentMethod === 'card').length;

    // Update stats
    document.getElementById('totalDonations').textContent = '\$' + totalDonations.toLocaleString();
    document.getElementById('totalDonors').textContent = totalDonors;
    document.getElementById('pendingConfirmations').textContent = pendingCount;
    document.getElementById('successRate').textContent = ((successRate / (realDonations.length + realConfirmations.length)) * 100).toFixed(0) + '%';

    // Payment method distribution
    const cardCount = realDonations.filter(d => d.paymentMethod === 'card').length;
    const upiCount = realDonations.filter(d => d.paymentMethod === 'upi').length;
    const totalPayments = cardCount + upiCount;

    document.getElementById('cardCount').textContent = cardCount;
    document.getElementById('upiCount').textContent = upiCount;
    document.getElementById('cardProgress').style.width = (cardCount / totalPayments * 100) + '%';
    document.getElementById('upiProgress').style.width = (upiCount / totalPayments * 100) + '%';

    // Recent donations chart
    const recentDonations = donations.slice(-5).map(d => `${d.name}: \$${d.amount}`).join('\n');
    document.getElementById('recentDonationsChart').textContent = recentDonations || 'No recent donations';
}

// Switch Tab
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'donations': 'Donation Records',
        'donors': 'Donor List',
        'confirmations': 'Payment Confirmations',
        'reports': 'Reports & Analytics',
        'campaigns': 'Relief Campaigns',
        'content': 'Content Management',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[tabName];

    // Load tab-specific data
    if (tabName === 'donations') {
        loadDonations();
    } else if (tabName === 'donors') {
        loadDonors();
    } else if (tabName === 'confirmations') {
        loadConfirmations();
    } else if (tabName === 'campaigns') {
        loadCampaigns();
    } else if (tabName === 'reports') {
        loadReports();
    } else if (tabName === 'content') {
        loadContent();
    }
}

// Load Donations Table
function loadDonations() {
    const tbody = document.getElementById('donationsTable');
    if (!tbody) return;

    // Get real donation data from localStorage
    const realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    
    if (realDonations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No donations found</td></tr>';
        return;
    }

    tbody.innerHTML = realDonations.map(d => `
        <tr>
            <td>${d.isAnonymous ? 'Anonymous Donor' : d.name}</td>
            <td>${d.email}</td>
            <td>\$${d.amount.toFixed(2)}</td>
            <td><span class="status-badge">${d.paymentMethod.toUpperCase()}</span></td>
            <td>${d.isAnonymous ? 'Anonymous' : 'Public'}</td>
            <td>${new Date(d.date).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary" onclick="editDonation(${d.id})">Edit</button>
                <button class="btn-danger" onclick="deleteDonation(${d.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function filterDonations() {
    const tbody = document.getElementById('donationsTable');
    if (!tbody) return;

    const searchTerm = document.getElementById('donationSearch').value.toLowerCase();
    const filterValue = document.getElementById('donationFilter').value;
    
    // Get real donation data from localStorage
    let realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    
    // Apply filters
    if (searchTerm) {
        realDonations = realDonations.filter(d => 
            (d.isAnonymous ? 'Anonymous Donor' : d.name).toLowerCase().includes(searchTerm) ||
            d.email.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filterValue) {
        realDonations = realDonations.filter(d => d.paymentMethod === filterValue);
    }
    
    if (realDonations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No donations match your search criteria</td></tr>';
        return;
    }

    tbody.innerHTML = realDonations.map(d => `
        <tr>
            <td>${d.isAnonymous ? 'Anonymous Donor' : d.name}</td>
            <td>${d.email}</td>
            <td>\$${d.amount.toFixed(2)}</td>
            <td><span class="status-badge">${d.paymentMethod.toUpperCase()}</span></td>
            <td>${d.isAnonymous ? 'Anonymous' : 'Public'}</td>
            <td>${new Date(d.date).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary" onclick="editDonation(${d.id})">Edit</button>
                <button class="btn-danger" onclick="deleteDonation(${d.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function editDonation(id) {
    const donations = JSON.parse(localStorage.getItem('donations')) || [];
    const donation = donations.find(d => d.id === id);
    
    if (!donation) return;
    
    // Create edit modal/form
    const newName = prompt('Edit donor name:', donation.name);
    const newEmail = prompt('Edit email:', donation.email);
    const newAmount = parseFloat(prompt('Edit amount:', donation.amount));
    
    if (newName !== null && newEmail !== null && !isNaN(newAmount)) {
        donation.name = newName.trim();
        donation.email = newEmail.trim();
        donation.amount = newAmount;
        
        localStorage.setItem('donations', JSON.stringify(donations));
        
        // Update dashboard and reload donations
        loadDashboard();
        loadDonations();
        
        // Trigger storage event to update other pages
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'donations',
            newValue: JSON.stringify(donations)
        }));
        
        alert('Donation updated successfully!');
    }
}

function deleteDonation(id) {
    if (!confirm('Are you sure you want to delete this donation? This action cannot be undone.')) {
        return;
    }
    
    const donations = JSON.parse(localStorage.getItem('donations')) || [];
    const updatedDonations = donations.filter(d => d.id !== id);
    
    localStorage.setItem('donations', JSON.stringify(updatedDonations));
    
    // Update dashboard and reload donations
    loadDashboard();
    loadDonations();
    
    // Trigger storage event to update other pages
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'donations',
        newValue: JSON.stringify(updatedDonations)
    }));
    
    alert('Donation deleted successfully!');
}

function addDonation() {
    const firstName = prompt('Enter donor first name (leave blank for anonymous):');
    const lastName = prompt('Enter donor last name (leave blank for anonymous):');
    const email = prompt('Enter donor email:');
    const amount = parseFloat(prompt('Enter donation amount:'));
    const paymentMethod = prompt('Enter payment method (card/upi):', 'card');
    
    if (firstName === null || lastName === null || email === null || isNaN(amount) || !paymentMethod) {
        return; // User cancelled
    }
    
    const isAnonymous = (!firstName.trim() && !lastName.trim());
    const donorName = isAnonymous ? 'Anonymous' : `${firstName.trim()} ${lastName.trim()}`;
    
    const newDonation = {
        id: Date.now(),
        name: donorName,
        email: email.trim(),
        amount: amount,
        paymentMethod: paymentMethod.toLowerCase(),
        isAnonymous: isAnonymous,
        date: new Date().toISOString()
    };
    
    const donations = JSON.parse(localStorage.getItem('donations')) || [];
    donations.push(newDonation);
    
    localStorage.setItem('donations', JSON.stringify(donations));
    
    // Update dashboard and reload donations
    loadDashboard();
    loadDonations();
    
    // Trigger storage event to update other pages
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'donations',
        newValue: JSON.stringify(donations)
    }));
    
    alert('Donation added successfully!');
}

// Load Donors Table
function loadDonors() {
    const tbody = document.getElementById('donorsTable');
    if (!tbody) return;

    // Get real donation data from localStorage
    const realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    
    if (realDonations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No donors found</td></tr>';
        return;
    }

    // Group donations by donor (using email as unique identifier)
    const donorMap = {};
    realDonations.forEach(d => {
        const key = d.email || d.name; // Fallback to name if no email
        if (!donorMap[key]) {
            donorMap[key] = {
                name: d.isAnonymous ? 'Anonymous Donor' : d.name,
                email: d.email || 'N/A',
                phone: 'N/A',
                total: 0,
                count: 0,
                firstDonation: d.date,
                lastDonation: d.date
            };
        }
        donorMap[key].total += d.amount;
        donorMap[key].count += 1;
        if (new Date(d.date) < new Date(donorMap[key].firstDonation)) {
            donorMap[key].firstDonation = d.date;
        }
        if (new Date(d.date) > new Date(donorMap[key].lastDonation)) {
            donorMap[key].lastDonation = d.date;
        }
    });

    tbody.innerHTML = Object.values(donorMap).map(d => `
        <tr>
            <td>${d.name}</td>
            <td>${d.email}</td>
            <td>${d.phone}</td>
            <td>\$${d.total.toFixed(2)}</td>
            <td>${d.count}</td>
            <td>${new Date(d.firstDonation).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary" onclick="viewDonorDetails('${d.email}')">View</button>
            </td>
        </tr>
    `).join('');
}

function searchDonors() {
    const tbody = document.getElementById('donorsTable');
    if (!tbody) return;

    const searchTerm = document.getElementById('donorSearch').value.toLowerCase();
    
    // Get real donation data from localStorage
    const realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    
    if (realDonations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No donors found</td></tr>';
        return;
    }

    // Group donations by donor (using email as unique identifier)
    const donorMap = {};
    realDonations.forEach(d => {
        const key = d.email || d.name; // Fallback to name if no email
        if (!donorMap[key]) {
            donorMap[key] = {
                name: d.isAnonymous ? 'Anonymous Donor' : d.name,
                email: d.email || 'N/A',
                phone: 'N/A',
                total: 0,
                count: 0,
                firstDonation: d.date,
                lastDonation: d.date
            };
        }
        donorMap[key].total += d.amount;
        donorMap[key].count += 1;
        if (new Date(d.date) < new Date(donorMap[key].firstDonation)) {
            donorMap[key].firstDonation = d.date;
        }
        if (new Date(d.date) > new Date(donorMap[key].lastDonation)) {
            donorMap[key].lastDonation = d.date;
        }
    });

    // Apply search filter
    let filteredDonors = Object.values(donorMap);
    if (searchTerm) {
        filteredDonors = filteredDonors.filter(d => 
            d.name.toLowerCase().includes(searchTerm) ||
            d.email.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredDonors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No donors match your search</td></tr>';
        return;
    }

    tbody.innerHTML = filteredDonors.map(d => `
        <tr>
            <td>${d.name}</td>
            <td>${d.email}</td>
            <td>${d.phone}</td>
            <td>\$${d.total.toFixed(2)}</td>
            <td>${d.count}</td>
            <td>${new Date(d.firstDonation).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary" onclick="viewDonorDetails('${d.email}')">View</button>
            </td>
        </tr>
    `).join('');
}

// Load Payment Confirmations
function loadConfirmations() {
    const container = document.getElementById('confirmationsContainer');
    if (!container) return;

    const filterValue = document.getElementById('confirmationFilter')?.value || '';
    const filtered = filterValue ? confirmations.filter(c => c.status === filterValue) : confirmations;

    document.getElementById('confirmationCount').textContent = 
        confirmations.filter(c => c.status === 'pending').length + ' Pending';

    container.innerHTML = filtered.map(c => `
        <div class="confirmation-card ${c.status}">
            <div class="confirmation-header">
                <div>
                    <h4>${c.donor}</h4>
                    <small>${c.email}</small>
                </div>
                <span class="status-badge ${c.status}">${c.status.toUpperCase()}</span>
            </div>
            <div class="confirmation-details">
                <div class="detail-row">
                    <span>Amount:</span>
                    <strong>$${c.amount}</strong>
                </div>
                <div class="detail-row">
                    <span>UPI ID:</span>
                    <strong>${c.upiId}</strong>
                </div>
                <div class="detail-row">
                    <span>Date:</span>
                    <strong>${c.date}</strong>
                </div>
            </div>
            ${c.status === 'pending' ? `
                <div class="confirmation-actions">
                    <button class="btn-confirm" onclick="confirmPayment(${c.id})">Confirm</button>
                    <button class="btn-reject" onclick="rejectPayment(${c.id})">Reject</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function confirmPayment(id) {
    const confirmation = confirmations.find(c => c.id === id);
    if (confirmation) {
        confirmation.status = 'confirmed';
        loadConfirmations();
        alert('Payment confirmed for ' + confirmation.donor);
    }
}

function rejectPayment(id) {
    const confirmation = confirmations.find(c => c.id === id);
    if (confirmation) {
        confirmation.status = 'rejected';
        loadConfirmations();
        alert('Payment rejected for ' + confirmation.donor);
    }
}

// Load Campaigns
function loadCampaigns() {
    const grid = document.getElementById('campaignsGrid');
    if (!grid) return;

    grid.innerHTML = campaigns.map(c => {
        const progress = (c.raised / c.goal) * 100;
        return `
            <div class="campaign-card">
                <h3>${c.name}</h3>
                <div class="campaign-goal">
                    Goal: \$${c.goal.toLocaleString()} | Raised: \$${c.raised.toLocaleString()}
                </div>
                <div class="campaign-progress">
                    <div class="campaign-progress-bar" style="width: ${progress}%"></div>
                </div>
                <small>${progress.toFixed(0)}% funded</small>
            </div>
        `;
    }).join('');
}

function openCampaignModal() {
    document.getElementById('campaignModal').classList.add('active');
}

function closeCampaignModal() {
    document.getElementById('campaignModal').classList.remove('active');
}

function createCampaign(e) {
    e.preventDefault();
    const name = document.getElementById('campaignName').value;
    const goal = parseInt(document.getElementById('campaignGoal').value);
    
    campaigns.push({
        id: campaigns.length + 1,
        name: name,
        goal: goal,
        raised: 0
    });
    
    loadCampaigns();
    closeCampaignModal();
    document.getElementById('campaignForm').reset();
    alert('Campaign created successfully!');
}

// Load Reports
function loadReports() {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonors = new Set(donations.map(d => d.email)).size;
    const avgDonation = (totalDonations / donations.length).toFixed(2);

    // Monthly
    document.getElementById('monthTotal').textContent = '\$' + totalDonations.toLocaleString();
    document.getElementById('monthDonors').textContent = totalDonors;
    document.getElementById('monthAverage').textContent = '\$' + avgDonation;

    // Yearly (same as monthly for demo)
    document.getElementById('yearTotal').textContent = '\$' + totalDonations.toLocaleString();
    document.getElementById('yearDonors').textContent = totalDonors;
    document.getElementById('yearAverage').textContent = '\$' + avgDonation;

    // Impact
    document.getElementById('familiesHelped').textContent = (totalDonations / 100).toFixed(0);
    document.getElementById('itemsDistributed').textContent = (totalDonations / 50).toFixed(0);
    document.getElementById('peopleReached').textContent = (totalDonations / 25).toFixed(0);
}

function generateMonthlyReport() {
    alert('Monthly report generated and ready for download!');
}

function generateYearlyReport() {
    alert('Yearly report generated and ready for download!');
}

function generateImpactReport() {
    alert('Impact report generated and ready for download!');
}

// Export Functions
function exportDonations() {
    const realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    
    let csv = 'Name,Email,Amount,Method,Privacy,Date\n';
    realDonations.forEach(d => {
        const displayName = d.isAnonymous ? 'Anonymous Donor' : d.name;
        const privacy = d.isAnonymous ? 'Anonymous' : 'Public';
        csv += `"${displayName}","${d.email}",${d.amount},"${d.paymentMethod}","${privacy}","${d.date}"\n`;
    });
    downloadCSV(csv, 'donations.csv');
}

function exportDonors() {
    const realDonations = JSON.parse(localStorage.getItem('donations')) || [];
    
    const donorMap = {};
    realDonations.forEach(d => {
        const key = d.email || d.name;
        if (!donorMap[key]) {
            donorMap[key] = {
                name: d.isAnonymous ? 'Anonymous Donor' : d.name,
                email: d.email || 'N/A',
                total: 0,
                count: 0,
                firstDonation: d.date
            };
        }
        donorMap[key].total += d.amount;
        donorMap[key].count += 1;
        if (new Date(d.date) < new Date(donorMap[key].firstDonation)) {
            donorMap[key].firstDonation = d.date;
        }
    });

    let csv = 'Name,Email,Total Donated,Donation Count,Join Date\n';
    Object.values(donorMap).forEach(d => {
        csv += `"${d.name}","${d.email}",${d.total.toFixed(2)},${d.count},"${d.firstDonation}"\n`;
    });
    downloadCSV(csv, 'donors.csv');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

// Settings
function saveDonationSettings() {
    const receiverUPI = document.getElementById('receiverUPI').value;
    const bankAccountName = document.getElementById('bankAccountName').value;
    const bankAccountNumber = document.getElementById('bankAccountNumber').value;
    const bankName = document.getElementById('bankName').value;
    const bankIFSC = document.getElementById('bankIFSC').value;
    const bankSWIFT = document.getElementById('bankSWIFT').value;
    const crisisOverview = document.getElementById('crisisOverview').value;
    const familiesAffected = document.getElementById('familiesAffected').value;
    const aidDistributed = document.getElementById('aidDistributed').value;
    const goalAmount = document.getElementById('goalAmount').value;

    // Save to localStorage
    localStorage.setItem('receiverUPI', receiverUPI);
    localStorage.setItem('bankAccountName', bankAccountName);
    localStorage.setItem('bankAccountNumber', bankAccountNumber);
    localStorage.setItem('bankName', bankName);
    localStorage.setItem('bankIFSC', bankIFSC);
    localStorage.setItem('bankSWIFT', bankSWIFT);
    localStorage.setItem('crisisOverview', crisisOverview);
    localStorage.setItem('familiesAffected', familiesAffected);
    localStorage.setItem('aidDistributed', aidDistributed);
    localStorage.setItem('goalAmount', goalAmount);

    alert('Donation settings saved successfully! Changes will be reflected on the main website.');
}

function saveGeneralSettings() {
    const orgName = document.getElementById('orgName').value;
    const siteTitle = document.getElementById('siteTitle').value;
    const siteTagline = document.getElementById('siteTagline').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const orgAddress = document.getElementById('orgAddress').value;
    
    // Social media links
    const facebookUrl = document.getElementById('facebookUrl').value;
    const twitterUrl = document.getElementById('twitterUrl').value;
    const instagramUrl = document.getElementById('instagramUrl').value;
    const linkedinUrl = document.getElementById('linkedinUrl').value;
    const privacyPolicyUrl = document.getElementById('privacyPolicyUrl').value;
    const termsUrl = document.getElementById('termsUrl').value;
    
    // Donation settings
    const currency = document.getElementById('currency').value;
    const minDonation = document.getElementById('minDonation').value;
    const maxDonation = document.getElementById('maxDonation').value;
    const taxInfo = document.getElementById('taxInfo').value;
    
    // System settings
    const maintenanceMode = document.getElementById('maintenanceMode').checked;
    const maintenanceMessage = document.getElementById('maintenanceMessage').value;
    const analyticsId = document.getElementById('analyticsId').value;

    // Save to localStorage
    localStorage.setItem('orgName', orgName);
    localStorage.setItem('siteTitle', siteTitle);
    localStorage.setItem('siteTagline', siteTagline);
    localStorage.setItem('contactEmail', contactEmail);
    localStorage.setItem('contactPhone', contactPhone);
    localStorage.setItem('orgAddress', orgAddress);
    localStorage.setItem('facebookUrl', facebookUrl);
    localStorage.setItem('twitterUrl', twitterUrl);
    localStorage.setItem('instagramUrl', instagramUrl);
    localStorage.setItem('linkedinUrl', linkedinUrl);
    localStorage.setItem('privacyPolicyUrl', privacyPolicyUrl);
    localStorage.setItem('termsUrl', termsUrl);
    localStorage.setItem('currency', currency);
    localStorage.setItem('minDonation', minDonation);
    localStorage.setItem('maxDonation', maxDonation);
    localStorage.setItem('taxInfo', taxInfo);
    localStorage.setItem('maintenanceMode', maintenanceMode);
    localStorage.setItem('maintenanceMessage', maintenanceMessage);
    localStorage.setItem('analyticsId', analyticsId);

    alert('General settings saved successfully! Changes will be reflected on the main website.');
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all password fields.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New password and confirmation do not match.');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
    }

    // For demo purposes, we'll just check against the default password
    // In a real application, this would involve server-side validation
    const storedPassword = localStorage.getItem('adminPassword') || 'password123';
    
    if (currentPassword !== storedPassword) {
        alert('Current password is incorrect.');
        return;
    }

    // Save new password
    localStorage.setItem('adminPassword', newPassword);
    
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    alert('Password changed successfully!');
}

// Utility Functions
function viewDonationDetails(id) {
    const donation = donations.find(d => d.id === id);
    if (donation) {
        alert(`Donation Details:\n\nName: ${donation.name}\nEmail: ${donation.email}\nAmount: \$${donation.amount}\nMethod: ${donation.method}\nType: ${donation.type}\nDate: ${donation.date}`);
    }
}

function viewDonorDetails(email) {
    const donorDonations = donations.filter(d => d.email === email);
    const total = donorDonations.reduce((sum, d) => sum + d.amount, 0);
    alert(`Donor Details:\n\nEmail: ${email}\nTotal Donated: \$${total}\nDonation Count: ${donorDonations.length}`);
}

// Content Management Functions
function loadContent() {
    loadFaqContent();
    loadImpactContent();
}

function loadFaqContent() {
    const faqContainer = document.getElementById('faqEditor');
    const faqItems = JSON.parse(localStorage.getItem('faqItems')) || getDefaultFaqItems();
    
    faqContainer.innerHTML = '';
    faqItems.forEach((item, index) => {
        const faqDiv = document.createElement('div');
        faqDiv.className = 'faq-edit-item';
        faqDiv.innerHTML = `
            <div class="form-group">
                <label>Question ${index + 1}</label>
                <input type="text" class="form-input faq-question" value="${item.question}" placeholder="Enter FAQ question">
            </div>
            <div class="form-group">
                <label>Answer ${index + 1}</label>
                <textarea class="form-input faq-answer" rows="3" placeholder="Enter FAQ answer">${item.answer}</textarea>
            </div>
            <button class="btn-danger" onclick="removeFaqItem(${index})">Remove</button>
        `;
        faqContainer.appendChild(faqDiv);
    });
}

function loadImpactContent() {
    const impactContainer = document.getElementById('impactEditor');
    const impactItems = JSON.parse(localStorage.getItem('impactItems')) || getDefaultImpactItems();
    
    impactContainer.innerHTML = '';
    impactItems.forEach((item, index) => {
        const impactDiv = document.createElement('div');
        impactDiv.className = 'impact-edit-item';
        impactDiv.innerHTML = `
            <div class="form-group">
                <label>Amount ${index + 1}</label>
                <input type="text" class="form-input impact-amount" value="${item.amount}" placeholder="e.g., $10">
            </div>
            <div class="form-group">
                <label>Description ${index + 1}</label>
                <textarea class="form-input impact-description" rows="2" placeholder="Describe the impact">${item.description}</textarea>
            </div>
            <button class="btn-danger" onclick="removeImpactItem(${index})">Remove</button>
        `;
        impactContainer.appendChild(impactDiv);
    });
}

function getDefaultFaqItems() {
    return [
        {
            question: "Where does my donation go?",
            answer: "100% of your donation goes directly to emergency relief efforts including food, clean water, shelter, and medical supplies for affected families. We maintain complete transparency about fund allocation and provide detailed reports to all donors."
        },
        {
            question: "Is my donation tax-deductible?",
            answer: "Yes! We are a registered 501(c)(3) nonprofit organization. You will receive a tax receipt for your donation via email within 24 hours, which you can use for tax deduction purposes."
        },
        {
            question: "Can I donate anonymously?",
            answer: "Yes, you can choose to make an anonymous donation during the checkout process. Just leave the donor information fields blank and provide only an email for tax receipts."
        }
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

function addFaqItem() {
    const faqItems = JSON.parse(localStorage.getItem('faqItems')) || getDefaultFaqItems();
    faqItems.push({ question: "", answer: "" });
    localStorage.setItem('faqItems', JSON.stringify(faqItems));
    loadFaqContent();
}

function addImpactItem() {
    const impactItems = JSON.parse(localStorage.getItem('impactItems')) || getDefaultImpactItems();
    impactItems.push({ amount: "", description: "" });
    localStorage.setItem('impactItems', JSON.stringify(impactItems));
    loadImpactContent();
}

function removeFaqItem(index) {
    const faqItems = JSON.parse(localStorage.getItem('faqItems')) || getDefaultFaqItems();
    faqItems.splice(index, 1);
    localStorage.setItem('faqItems', JSON.stringify(faqItems));
    loadFaqContent();
}

function removeImpactItem(index) {
    const impactItems = JSON.parse(localStorage.getItem('impactItems')) || getDefaultImpactItems();
    impactItems.splice(index, 1);
    localStorage.setItem('impactItems', JSON.stringify(impactItems));
    loadImpactContent();
}

function saveContent() {
    // Save FAQ items
    const faqQuestions = document.querySelectorAll('.faq-question');
    const faqAnswers = document.querySelectorAll('.faq-answer');
    const faqItems = [];
    
    faqQuestions.forEach((question, index) => {
        if (question.value.trim() && faqAnswers[index].value.trim()) {
            faqItems.push({
                question: question.value.trim(),
                answer: faqAnswers[index].value.trim()
            });
        }
    });
    
    localStorage.setItem('faqItems', JSON.stringify(faqItems));
    
    // Save Impact items
    const impactAmounts = document.querySelectorAll('.impact-amount');
    const impactDescriptions = document.querySelectorAll('.impact-description');
    const impactItems = [];
    
    impactAmounts.forEach((amount, index) => {
        if (amount.value.trim() && impactDescriptions[index].value.trim()) {
            impactItems.push({
                amount: amount.value.trim(),
                description: impactDescriptions[index].value.trim()
            });
        }
    });
    
    localStorage.setItem('impactItems', JSON.stringify(impactItems));
    
    alert('Content saved successfully! Changes will be reflected on the main website.');
}

function loadSettings() {
    // Load organization settings
    document.getElementById('orgName').value = localStorage.getItem('orgName') || 'Flood Crisis Relief';
    document.getElementById('siteTitle').value = localStorage.getItem('siteTitle') || 'Flood Crisis Relief - Donate Now';
    document.getElementById('siteTagline').value = localStorage.getItem('siteTagline') || 'Help us rebuild communities affected by devastating floods';
    document.getElementById('contactEmail').value = localStorage.getItem('contactEmail') || 'donate@floodrelief.org';
    document.getElementById('contactPhone').value = localStorage.getItem('contactPhone') || '+1-800-RELIEF-1';
    document.getElementById('orgAddress').value = localStorage.getItem('orgAddress') || '';
    
    // Load social media links
    document.getElementById('facebookUrl').value = localStorage.getItem('facebookUrl') || '';
    document.getElementById('twitterUrl').value = localStorage.getItem('twitterUrl') || '';
    document.getElementById('instagramUrl').value = localStorage.getItem('instagramUrl') || '';
    document.getElementById('linkedinUrl').value = localStorage.getItem('linkedinUrl') || '';
    document.getElementById('privacyPolicyUrl').value = localStorage.getItem('privacyPolicyUrl') || '';
    document.getElementById('termsUrl').value = localStorage.getItem('termsUrl') || '';
    
    // Load donation settings
    document.getElementById('currency').value = localStorage.getItem('currency') || 'INR';
    document.getElementById('minDonation').value = localStorage.getItem('minDonation') || '10';
    document.getElementById('maxDonation').value = localStorage.getItem('maxDonation') || '10000';
    document.getElementById('taxInfo').value = localStorage.getItem('taxInfo') || '';
    
    // Load payment settings
    document.getElementById('receiverUPI').value = localStorage.getItem('receiverUPI') || 'priyanshupranav8@okaxis';
    document.getElementById('bankAccountName').value = localStorage.getItem('bankAccountName') || '';
    document.getElementById('bankAccountNumber').value = localStorage.getItem('bankAccountNumber') || '';
    document.getElementById('bankName').value = localStorage.getItem('bankName') || '';
    document.getElementById('bankIFSC').value = localStorage.getItem('bankIFSC') || '';
    document.getElementById('bankSWIFT').value = localStorage.getItem('bankSWIFT') || '';
    
    // Load crisis information
    document.getElementById('crisisOverview').value = localStorage.getItem('crisisOverview') || 'Communities across the region are facing unprecedented flooding. Thousands of families have lost their homes, livelihoods, and access to clean water and food. Your donation can provide emergency relief and help rebuild.';
    document.getElementById('familiesAffected').value = localStorage.getItem('familiesAffected') || '5,000+';
    document.getElementById('aidDistributed').value = localStorage.getItem('aidDistributed') || '\$2.5M';
    document.getElementById('goalAmount').value = localStorage.getItem('goalAmount') || '500000';
    
    // Load system settings
    document.getElementById('maintenanceMode').checked = localStorage.getItem('maintenanceMode') === 'true';
    document.getElementById('maintenanceMessage').value = localStorage.getItem('maintenanceMessage') || 'Site is under maintenance. Please check back later.';
    document.getElementById('analyticsId').value = localStorage.getItem('analyticsId') || '';
}

// Sidebar Toggle
function toggleSidebar() {
    document.querySelector('.admin-sidebar').classList.toggle('active');
}

// User Menu
function toggleUserMenu() {
    // Implement user menu functionality
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminName');
        window.location.href = 'admin-login.html';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('campaignModal');
    if (event.target === modal) {
        closeCampaignModal();
    }
}
