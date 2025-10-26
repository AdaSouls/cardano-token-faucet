// API base URL
const API_BASE_URL = window.location.origin;

// Cache for Lucid module
let lucidModule = null;

// Load Lucid dynamically
async function loadLucid() {
    if (lucidModule) {
        return lucidModule;
    }
    
    try {
        console.log('Loading Lucid from CDN...');
        // Use dynamic import to load Lucid as ES module
        lucidModule = await import('https://esm.sh/lucid-cardano@0.10.7');
        console.log('✅ Lucid loaded successfully');
        return lucidModule;
    } catch (error) {
        console.error('Failed to load Lucid:', error);
        throw new Error('Failed to load Lucid library. Please refresh and try again.');
    }
}

// DOM elements
const errorMessage = document.getElementById('errorMessage');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const loadingState = document.getElementById('loadingState');
const loadingText = document.getElementById('loadingText');

// Step 2 elements
const connectedAddressEl = document.getElementById('connectedAddress');
const walletBadgeEl = document.getElementById('walletBadge');
const requestBtn = document.getElementById('requestBtn');
const disconnectBtn = document.getElementById('disconnectBtn');

// Step 3 elements
const txHashEl = document.getElementById('txHash');
const copyTxBtn = document.getElementById('copyTxBtn');
const resetBtn = document.getElementById('resetBtn');

// Wallet buttons
const walletButtons = document.querySelectorAll('.wallet-btn');

// State
let lucid = null;
let connectedWallet = null;
let walletAddress = null;
let faucetInfo = null;

// Wallet names mapping
const walletNames = {
    nami: 'Nami',
    eternl: 'Eternl',
    flint: 'Flint',
    typhon: 'Typhon',
    typhoncip30: 'Typhon'
};

// Initialize event listeners
walletButtons.forEach(btn => {
    btn.addEventListener('click', () => connectWallet(btn.dataset.wallet));
});

requestBtn.addEventListener('click', handleRequestTokens);
disconnectBtn.addEventListener('click', handleDisconnect);
resetBtn.addEventListener('click', handleReset);
copyTxBtn.addEventListener('click', () => copyToClipboard(txHashEl.textContent, copyTxBtn));

// Show/hide functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showLoading(message = 'Processing...') {
    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'none';
    loadingText.textContent = message;
    loadingState.style.display = 'block';
}

function hideLoading() {
    loadingState.style.display = 'none';
}

function showStep(stepNum) {
    hideError();
    hideLoading();
    step1.style.display = stepNum === 1 ? 'block' : 'none';
    step2.style.display = stepNum === 2 ? 'block' : 'none';
    step3.style.display = stepNum === 3 ? 'block' : 'none';
}

// Format address for display
function formatAddress(address) {
    if (address.length > 20) {
        return `${address.slice(0, 15)}...${address.slice(-8)}`;
    }
    return address;
}

// Fetch faucet info from API
async function fetchFaucetInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/faucet/status`);
        if (!response.ok) {
            throw new Error('Failed to fetch faucet info');
        }
        faucetInfo = await response.json();
        console.log('Faucet info:', faucetInfo);
        return faucetInfo;
    } catch (error) {
        console.error('Failed to fetch faucet info:', error);
        throw new Error('Could not load faucet information');
    }
}

// Connect to Cardano wallet
async function connectWallet(walletName) {
    hideError();
    showLoading('Loading Lucid library...');
    
    try {
        // Load Lucid dynamically
        const { Lucid, Blockfrost } = await loadLucid();
        
        showLoading('Connecting to wallet...');
        
        // Check if wallet is installed
        if (!window.cardano || !window.cardano[walletName]) {
            throw new Error(`${walletNames[walletName]} wallet is not installed. Please install it first.`);
        }
        
        // Fetch faucet info first
        await fetchFaucetInfo();
        
        if (!faucetInfo.blockfrost || !faucetInfo.blockfrost.projectId) {
            throw new Error('Blockfrost configuration not available');
        }
        
        // Enable the wallet
        const walletApi = await window.cardano[walletName].enable();
        connectedWallet = walletName;
        
        // Determine network and Blockfrost URL
        const network = faucetInfo.blockfrost.network;
        const blockfrostUrl = network === 'mainnet' 
            ? 'https://cardano-mainnet.blockfrost.io/api/v0'
            : 'https://cardano-preprod.blockfrost.io/api/v0';
        
        console.log('Initializing Lucid with:', {
            network: network === 'mainnet' ? 'Mainnet' : 'Preprod',
            blockfrostUrl
        });
        
        showLoading('Initializing Lucid...');
        
        // Initialize Lucid
        lucid = await Lucid.new(
            new Blockfrost(blockfrostUrl, faucetInfo.blockfrost.projectId),
            network === 'mainnet' ? 'Mainnet' : 'Preprod'
        );
        
        // Select wallet
        lucid.selectWallet(walletApi);
        
        // Get wallet address
        walletAddress = await lucid.wallet.address();
        
        console.log('✅ Connected to', walletNames[walletName], 'wallet');
        console.log('📍 Address:', walletAddress);
        
        // Display step 2
        connectedAddressEl.textContent = formatAddress(walletAddress);
        walletBadgeEl.textContent = walletNames[walletName];
        
        showStep(2);
        
    } catch (error) {
        console.error('Wallet connection error:', error);
        showStep(1);
        showError(error.message || 'Failed to connect wallet');
    }
}

// Handle request tokens - build and submit transaction
async function handleRequestTokens() {
    if (!lucid || !faucetInfo) {
        showError('Wallet not connected or faucet info not loaded');
        return;
    }
    
    hideError();
    showLoading('Checking eligibility...');
    requestBtn.disabled = true;
    
    try {
        // Check rate limit first
        const checkResponse = await fetch(`${API_BASE_URL}/api/v1/faucet/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress }),
        });
        
        if (!checkResponse.ok) {
            const errorData = await checkResponse.json();
            throw new Error(errorData.message || 'Rate limit check failed');
        }
        
        const faucetData = await checkResponse.json();
        const faucetAddress = faucetData.faucetAddress;
        const amountLovelace = BigInt(faucetData.minimumAdaRequired * 1000000 || 2000000);
        
        console.log('Building transaction to send', amountLovelace.toString(), 'lovelace to', faucetAddress);
        
        showLoading('Building transaction...');
        
        // Build transaction using Lucid
        const tx = await lucid
            .newTx()
            .payToAddress(faucetAddress, { lovelace: amountLovelace })
            .complete();
        
        console.log('Transaction built successfully');
        console.log('Please sign the transaction in your wallet...');
        
        showLoading('Please sign the transaction in your wallet...');
        
        // Sign the transaction (opens wallet popup)
        const signedTx = await tx.sign().complete();
        
        console.log('Transaction signed');
        
        showLoading('Submitting transaction...');
        
        // Submit the signed transaction
        const txHash = await signedTx.submit();
        
        console.log('✅ Transaction submitted:', txHash);
        
        // Show success page with tx hash
        txHashEl.textContent = txHash;
        showStep(3);
        
    } catch (error) {
        console.error('Transaction error:', error);
        showStep(2);
        requestBtn.disabled = false;
        
        // Handle specific error types
        let errorMessage = error.message || 'Transaction failed';
        
        if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
            errorMessage = '⏱️ Rate limit exceeded. You can only request tokens once every 12 hours.';
        } else if (errorMessage.toLowerCase().includes('cancel') || errorMessage.toLowerCase().includes('reject') || errorMessage.toLowerCase().includes('decline')) {
            errorMessage = 'Transaction cancelled by user.';
        } else if (errorMessage.toLowerCase().includes('insufficient') || errorMessage.toLowerCase().includes('not enough')) {
            errorMessage = 'Insufficient funds. You need at least 3 ADA (2 ADA + fees).';
        } else if (errorMessage.toLowerCase().includes('timeout')) {
            errorMessage = 'Transaction signing timeout. Please try again.';
        }
        
        showError(errorMessage);
    }
}

// Handle disconnect
function handleDisconnect() {
    lucid = null;
    connectedWallet = null;
    walletAddress = null;
    faucetInfo = null;
    showStep(1);
}

// Handle reset (go back to step 2 to request again)
function handleReset() {
    showStep(2);
    requestBtn.disabled = false;
}

// Copy to clipboard helper
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓';
        button.style.color = '#4caf50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.color = '';
        }, 2000);
    }).catch(() => {
        alert('Failed to copy. Please copy manually: ' + text);
    });
}

// Initialize on page load
console.log('🌊 ALDEA Faucet loaded');

// Check for wallets
setTimeout(() => {
    if (window.cardano) {
        const availableWallets = Object.keys(window.cardano).filter(key => 
            typeof window.cardano[key] === 'object' && window.cardano[key].enable
        );
        console.log('Available wallets:', availableWallets.length > 0 ? availableWallets : 'None detected');
        
        if (availableWallets.length === 0) {
            console.warn('No Cardano wallets detected. Please install Nami, Eternl, Flint, or Typhon.');
        }
    } else {
        console.warn('No Cardano wallets detected. Please install Nami, Eternl, Flint, or Typhon.');
    }
}, 500);
