// Sidebar Content View
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const navLinks = document.querySelectorAll(".nav-link[data-target]");
  const views = document.querySelectorAll(".view");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      navLinks.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");

      const targetId = this.dataset.target;
      views.forEach((view) => {
        view.classList.remove("active");
        if (view.id === targetId) {
          view.classList.add("active");
        }
      });

      if (targetId === "favoritesView") {
        displayFavorites();
      }
      if (targetId === "walletView") {
        displayWallet();
      }
      if (targetId === "transferView") {
        loadWalletToDropdown();
      }
    });
  });

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });
});

const container = document.getElementById("crypto-container");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");

let allCoins = [];

// Fetching API
const fetchCryptoData = async () => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1"
    );
    const data = await response.json();
    console.log("Data Updated", data);
    allCoins = data;
    displayCrypto(data);

    if (document.getElementById("walletView").classList.contains("active")) {
      updateWalletTotalValue();
    }
  } catch (error) {
    console.error("API fetch error:", error);
  }
};

// We are adding an interval to update the data every 30 seconds.
setInterval(fetchCryptoData, 30000);

// Display Card
const displayCrypto = (coins) => {
  container.innerHTML = coins
    .map((coin) => {
      const priceChange = coin.price_change_percentage_24h.toFixed(2);
      const changeClass = priceChange >= 0 ? "text-success" : "text-danger";
      const isFavorite = isCoinFavorite(coin.id);

      return `
  <div class="col-md-4">
    <div class="card">
      <img src="${coin.image}" class="card-img-top" alt="${coin.name}">
      <div class="card-body">
        <h5 class="card-title">${coin.name} (${coin.symbol.toUpperCase()})</h5>
        <p class="card-text fw-semibold">Price: $${coin.current_price}</p>
        <p class="card-text ${changeClass} fw-semibold">24h: %${priceChange}</p>
        <div class="card-actions">
          <button class="btn btn-outline-dark" onclick="showChart('${
            coin.id
          }', '${coin.name}', '${
        coin.price_change_percentage_24h
      }')">Show Chart</button>
          <button class="btn ${
            isFavorite ? "btn-danger" : "btn-outline-danger"
          }" onclick="toggleFavorite('${coin.id}')">
            ${isFavorite ? "Remove" : "Favorite"}
          </button>
          <button class="btn ${
            isCoinInWallet(coin.id) ? "btn-success" : "btn-outline-success"
          }" onclick="toggleWallet('${coin.id}')">
            ${isCoinInWallet(coin.id) ? "Remove" : "Add"}
          </button>
        </div>
      </div>
    </div>
  </div>
`;
    })
    .join("");
};

// Search Filter By Name and By Symbol
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filteredData = allCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(term) ||
      coin.symbol.toLowerCase().includes(term)
  );
  displayCrypto(filteredData);
});

// Filter Button Click Event
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.filter;
    let filteredData = [...allCoins];

    if (type === "favorites") {
      // Get the favorite coins from localStorage for current user
      displayFavorites();
      return;
    } else if (type === "gainers") {
      filteredData = allCoins.filter(
        (coin) => coin.price_change_percentage_24h >= 0
      );
    } else if (type === "losers") {
      filteredData = allCoins.filter(
        (coin) => coin.price_change_percentage_24h < 0
      );
    }

    displayCrypto(filteredData);
  });
});

// Chart Section
let chart;

const showChart = async (coinId, coinName, priceChange) => {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`
  );
  const data = await response.json();
  console.log(data);
  const labels = data.prices.map((p) => new Date(p[0]).toLocaleDateString());
  console.log(labels);
  const prices = data.prices.map((price) => price[1]);
  console.log(prices);

  const ctx = document.getElementById("priceChart").getContext("2d");

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${coinName} - Last 7 Days`,
          data: prices,
          borderColor: priceChange >= 0 ? "green" : "red",
          backgroundColor:
            priceChange >= 0 ? "rgba(0, 128, 0, 0.2)" : "rgba(255, 0, 0, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            color: "#000",
          },
        },
        x: {
          ticks: {
            color: "#000",
          },
        },
      },
    },
  });

  const modal = new bootstrap.Modal(document.getElementById("chartModal"));
  modal.show();
};

fetchCryptoData();

// Function to check if the coin is in favorites
const isCoinFavorite = (coinId) => {
  let currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    return false;
  }

  const favorites =
    JSON.parse(localStorage.getItem(`${currentUser}_favorites`)) || [];
  // Check if the coinId is in the favorites list
  return favorites.includes(coinId);
};

// Favorite Coin Toggle
const toggleFavorite = (coinId) => {
  let currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("You need to log in first.");
    return;
  }

  let favorites =
    JSON.parse(localStorage.getItem(`${currentUser}_favorites`)) || [];

  // Check if the coin is already in the favorites
  if (favorites.includes(coinId)) {
    // Show confirmation dialog before removing the coin from favorites
    const confirmRemoval = confirm(
      "Are you sure you want to remove this coin from favorites?"
    );

    if (confirmRemoval) {
      favorites = favorites.filter((id) => id !== coinId);
      localStorage.setItem(
        `${currentUser}_favorites`,
        JSON.stringify(favorites)
      );
      displayCrypto(allCoins);
    }
  } else {
    favorites.push(coinId);
    localStorage.setItem(`${currentUser}_favorites`, JSON.stringify(favorites));
    displayCrypto(allCoins);
  }
};

// Display User's Favorites
const displayFavorites = () => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("You need to log in first.");
    return;
  }

  const favoritesContainer = document.getElementById("favorites-container");

  // Get fav coin id
  const favorites =
    JSON.parse(localStorage.getItem(`${currentUser}_favorites`)) || [];

  if (favorites.length === 0) {
    favoritesContainer.innerHTML = "<p>No favorites have been added yet.</p>";
    return;
  }

  const filteredData = allCoins.filter((coin) => favorites.includes(coin.id));

  // Favorite coin card rendering
  favoritesContainer.innerHTML = filteredData
    .map((coin) => {
      const priceChange = coin.price_change_percentage_24h.toFixed(2);
      const changeClass = priceChange >= 0 ? "text-success" : "text-danger";
      return `
        <div class="col-md-4">
          <div class="card">
            <img src="${coin.image}" class="card-img-top" alt="${coin.name}">
            <div class="card-body">
              <h5 class="card-title">${
                coin.name
              } (${coin.symbol.toUpperCase()})</h5>
              <p class="card-text fw-semibold">Price: $${coin.current_price}</p>
              <p class="card-text ${changeClass} fw-semibold">24h: %${priceChange}</p>
              <div class="card-actions">
                <button class="btn btn-outline-dark" onclick="showChart('${
                  coin.id
                }', '${coin.name}', '${coin.price_change_percentage_24h}')">
                  Show Chart
                </button>
                <button class="btn btn-danger" onclick="toggleFavorite('${
                  coin.id
                }')">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
};

// Welcome Message For Users
const currentEmail = localStorage.getItem("currentUser");

if (currentEmail) {
  const user = JSON.parse(localStorage.getItem(currentEmail));
  const welcomeElement = document.getElementById("welcomeMessage");
  welcomeElement.textContent = `Welcome, ${user.name}!`;
}

// Modified displayWallet function
const displayWallet = () => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return;

  const wallet =
    JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];
  const walletList = document.getElementById("walletList");
  walletList.innerHTML = "";

  if (wallet.length === 0) {
    walletList.innerHTML =
      "<li class='list-group-item'>No coins in your wallet yet.</li>";
    updateWalletTotalValue();
    return;
  }

  wallet.forEach((walletItem) => {
    const coin = allCoins.find((c) => c.id === walletItem.id);
    if (coin) {
      const li = document.createElement("li");
      li.classList.add("list-group-item");
      li.innerHTML = `
        <img src="${coin.image}" alt="${coin.name}" class="coin-icon"/>
        <div class="coin-details">
          <div>
            <div class="coin-name">${
              coin.name
            } <span class="text-muted">(${coin.symbol.toUpperCase()})</span></div>
            <div class="coin-price">$${coin.current_price}</div>
          </div>
          <div class="coin-amount">${walletItem.amount}</div>
        </div>
      `;
      walletList.appendChild(li);
    }
  });

  updateWalletTotalValue();
};

// Function to check if the coin is in wallet
const isCoinInWallet = (coinId) => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return false;

  const wallet =
    JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];
  return wallet.some((item) => item.id === coinId);
};

// Coin in Wallet Toggle
const toggleWallet = (coinId) => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("You need to log in first.");
    return;
  }

  let wallet = JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];
  const existingCoin = wallet.find((item) => item.id === coinId);

  if (existingCoin) {
    const confirmRemoval = confirm(
      `You already have ${existingCoin.amount} ${coinId}. Do you want to remove it from wallet?`
    );

    if (confirmRemoval) {
      wallet = wallet.filter((item) => item.id !== coinId);
      localStorage.setItem(`${currentUser}_wallet`, JSON.stringify(wallet));
      displayCrypto(allCoins);
      return;
    }
  }

  const amount = prompt(
    `How many ${coinId} do you want to add to your wallet?`
  );
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (existingCoin) {
    existingCoin.amount += Number(amount);
  } else {
    wallet.push({
      id: coinId,
      amount: Number(amount),
    });
  }

  localStorage.setItem(`${currentUser}_wallet`, JSON.stringify(wallet));
  displayCrypto(allCoins);
};

// Show dropdown menu for coin in users wallet
const loadWalletToDropdown = () => {
  const currentUser = localStorage.getItem("currentUser");
  const wallet =
    JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];

  const coinSelect = document.getElementById("coinSelect");
  coinSelect.innerHTML = '<option value="">-- Select Coin --</option>';

  wallet
    .filter((item) => item.id && item.amount > 0)
    .forEach((coin) => {
      const option = document.createElement("option");
      option.value = coin.id;
      option.textContent = `${coin.id} (${coin.amount})`;
      coinSelect.appendChild(option);
    });
};

// Submit transfer
const submitTransfer = () => {
  const currentUser = localStorage.getItem("currentUser");
  const recipientEmail = document.getElementById("receiverEmail").value.trim();
  const coinId = document.getElementById("coinSelect").value;
  const amountToSend = Number(document.getElementById("amountToSend").value);

  if (!recipientEmail || !coinId || isNaN(amountToSend) || amountToSend <= 0) {
    alert("Please fill all fields correctly.");
    return;
  }

  if (recipientEmail === currentUser) {
    alert("You cannot send coins to yourself.");
    return;
  }

  const allUsers = JSON.parse(localStorage.getItem("allUsers")) || [];
  const receiverExists = allUsers.some((user) => user.email === recipientEmail);
  if (!receiverExists) {
    alert("Recipient user not found.");
    return;
  }

  const senderWallet =
    JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];
  const selectedCoin = senderWallet.find((item) => item.id === coinId);

  if (!selectedCoin || selectedCoin.amount < amountToSend) {
    alert(`You don't have enough ${coinId} to send.`);
    return;
  }

  selectedCoin.amount -= amountToSend;
  const updatedSenderWallet =
    selectedCoin.amount === 0
      ? senderWallet.filter((item) => item.id !== coinId)
      : senderWallet;
  localStorage.setItem(
    `${currentUser}_wallet`,
    JSON.stringify(updatedSenderWallet)
  );

  const receiverWallet =
    JSON.parse(localStorage.getItem(`${recipientEmail}_wallet`)) || [];
  const receiverCoin = receiverWallet.find((item) => item.id === coinId);
  if (receiverCoin) {
    receiverCoin.amount += amountToSend;
  } else {
    receiverWallet.push({ id: coinId, amount: amountToSend });
  }
  localStorage.setItem(
    `${recipientEmail}_wallet`,
    JSON.stringify(receiverWallet)
  );

  alert(
    `Successfully transferred ${amountToSend} ${coinId} to ${recipientEmail}.`
  );

  // Clear inputs
  document.getElementById("receiverEmail").value = "";
  document.getElementById("coinSelect").value = "";
  document.getElementById("amountToSend").value = "";

  displayCrypto(allCoins);
  loadWalletToDropdown();
};

// Theme Toggle Functionality
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  // Check for saved theme preference or respect OS preference
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = localStorage.getItem("theme");

  // If user previously selected a theme, apply it
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.checked = true;
  } else if (savedTheme === "light") {
    document.body.classList.remove("dark-mode");
    themeToggle.checked = false;
  } else {
    // Otherwise apply based on OS preference
    if (prefersDarkScheme.matches) {
      document.body.classList.add("dark-mode");
      themeToggle.checked = true;
    }
  }

  // Handle toggle clicks
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  });
});

// Function to calculate and display the total wallet value
function updateWalletTotalValue() {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return;

  const wallet =
    JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];

  // Calculate total value by multiplying each coin's amount with its current price
  let totalValue = 0;

  wallet.forEach((walletItem) => {
    const coin = allCoins.find((c) => c.id === walletItem.id);
    if (coin) {
      const coinValue = walletItem.amount * coin.current_price;
      totalValue += coinValue;
    }
  });

  // Format the total value with commas and 2 decimal places
  const formattedTotal = totalValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Update the UI with the calculated total value
  const totalValueElement = document.getElementById("walletTotalValue");
  totalValueElement.textContent = `💵 Total Value: ${formattedTotal}`;

  // Add a class to animate the value if it changes
  totalValueElement.classList.add("value-updated");

  // Remove the animation class after the animation completes
  setTimeout(() => {
    totalValueElement.classList.remove("value-updated");
  }, 1000);
}
