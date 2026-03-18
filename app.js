const TARGET_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 2 weeks default
const WHITELIST = new Set([
  '0x1111111111111111111111111111111111111111'.toLowerCase(),
  '0x2222222222222222222222222222222222222222'.toLowerCase(),
  '0x3333333333333333333333333333333333333333'.toLowerCase(),
]);

let walletAddress = null;

function formatDuration(millis) {
  const total = Math.max(0, millis);
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function updateCountdown() {
  const now = Date.now();
  const remaining = TARGET_DATE.getTime() - now;
  const countdownEl = document.querySelector('#countdown');
  if (!countdownEl) return;

  if (remaining <= 0) {
    countdownEl.textContent = 'Liquidity pool is live!';
  } else {
    countdownEl.textContent = formatDuration(remaining);
  }
  document.querySelector('#targetDate').textContent = TARGET_DATE.toUTCString();
}

async function connectWallet() {
  const status = document.querySelector('#whitelistStatus');
  const wallet = document.querySelector('#walletAddr');

  if (!window.ethereum) {
    wallet.textContent = 'Wallet: MetaMask not installed';
    status.textContent = 'Please install MetaMask.';
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];
    wallet.textContent = `Wallet: ${walletAddress}`;

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== CONFIG.NETWORK.chainId) {
      status.textContent = `Wrong network: ${chainId}. Expected ${CONFIG.NETWORK.chainId}.`;
    } else {
      status.textContent = 'Network OK';
    }

    const whitelisted = WHITELIST.has(walletAddress.toLowerCase());
    status.textContent = whitelisted ? '✅ Whitelisted for early buy' : '❌ Not whitelisted';
    await loadTxHistory();
  } catch (error) {
    console.error(error);
    status.textContent = `Error connecting wallet: ${error.message || error}`;
  }
}

async function addTokenToMetaMask() {
  const statusEl = document.querySelector('#addTokenStatus');
  if (!window.ethereum) {
    statusEl.textContent = 'MetaMask is not available.';
    return;
  }

  try {
    const added = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: CONFIG.TOKEN.address,
          symbol: CONFIG.TOKEN.symbol,
          decimals: 18,
          image: 'https://via.placeholder.com/64/2563eb/fff?text=TAMU',
        },
      },
    });

    statusEl.textContent = added ? 'Token added successfully.' : 'Token not added.';
  } catch (error) {
    statusEl.textContent = `Error when adding token: ${error.message || error}`;
  }
}

async function loadTxHistory() {
  const list = document.querySelector('#txHistory');
  if (!list) return;

  list.innerHTML = '<li>Loading transaction history...</li>';
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.NETWORK.rpc);

  if (!walletAddress) {
    list.innerHTML = '<li>Connect wallet first.</li>';
    return;
  }

  try {
    const history = await provider.getHistory(walletAddress, -10000000, 'latest');
    if (!history || history.length === 0) {
      list.innerHTML = '<li>No transactions found for this wallet.</li>';
      return;
    }

    const slice = history.slice(-10).reverse();
    list.innerHTML = '';
    for (const tx of slice) {
      const item = document.createElement('li');
      const valueEth = ethers.utils.formatEther(tx.value ?? 0);
      const isTokenTx = tx.to && tx.to.toLowerCase() === CONFIG.TOKEN.address.toLowerCase();
      item.innerHTML = `
        <strong>${tx.hash.substring(0, 10)}...</strong> — ${valueEth} ETH
        to <a href="${CONFIG.NETWORK.explorer}/tx/${tx.hash}" target="_blank">tx</a>
        ${isTokenTx ? '<span class="badge">TAMU</span>' : ''}
      `;
      list.appendChild(item);
    }
  } catch (error) {
    console.error(error);
    list.innerHTML = `<li>Error loading history: ${error.message || error}</li>`;
  }
}

function buildPriceChart() {
  const container = document.querySelector('#priceChartContainer');
  if (!container) return;

  const tokenAddress = CONFIG.TOKEN.address.toLowerCase();
  const symbol = CONFIG.TOKEN.symbol;
  const url = `https://www.dextools.io/app/en/base/pair-explorer/${tokenAddress}`;

  container.innerHTML = `<iframe src="${url}" title="${symbol} price chart"></iframe>`;
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', () => {
    updateCountdown();
    setInterval(updateCountdown, 1000);

    document.querySelector('#connectWallet').addEventListener('click', connectWallet);
    document.querySelector('#addToken').addEventListener('click', addTokenToMetaMask);
    document.querySelector('#refreshHistory').addEventListener('click', loadTxHistory);

    buildPriceChart();
  });
}

// expose small helpers for unit tests
if (typeof module !== 'undefined') {
  module.exports = { formatDuration, WHITELIST };
}
