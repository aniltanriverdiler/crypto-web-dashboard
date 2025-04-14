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
  } catch (error) {}
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
        <img src="${coin.image}" class="card-img-top" alt="...">
        <div class="card-body">
          <h5 class="card-title">${
            coin.name
          } (${coin.symbol.toUpperCase()})</h5>
          <p class="card-text fw-semibold">Fiyat: $${coin.current_price}</p>
          <p class="card-text ${changeClass} fw-semibold">24h: %${priceChange}</p>
          <button class="btn btn-outline-dark" onclick="showChart('${
            coin.id
          }', '${coin.name}', '${
        coin.price_change_percentage_24h
      }')" >Grafiği Göster</button>
      <button class="btn ${isFavorite ? "btn-danger" : "btn-outline-danger"}"
       onclick="toggleFavorite('${coin.id}')">
       ${isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      </button>
      <button class="btn ${
        isCoinInWallet(coin.id) ? "btn-success" : "btn-outline-success"
      }" onclick="toggleWallet('${coin.id}')">
      ${isCoinInWallet(coin.id) ? "Remove from Wallet" : "Add to Wallet"}      
      </button>
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
          label: `${coinName} - Son 7 Gün`,
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
  let currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("You need to log in first.");
    return;
  }

  const favorites =
    JSON.parse(localStorage.getItem(`${currentUser}_favorites`)) || [];

  if (favorites.length === 0) {
    container.innerHTML = "<p>Henüz favori eklenmedi.</p>";
    return;
  }

  const filteredData = allCoins.filter((coin) => favorites.includes(coin.id));

  displayCrypto(filteredData);
};

// Welcome Message For Users
const currentEmail = localStorage.getItem("currentUser");

if (currentEmail) {
  const user = JSON.parse(localStorage.getItem(currentEmail));
  const welcomeElement = document.getElementById("welcomeMessage");
  welcomeElement.textContent = `Welcome, ${user.name}!`;
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

// Display Users Wallet
const displayWallet = () => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return;

  const wallet =
    JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];
  const ul = document.getElementById("walletList");
  ul.innerHTML = "";

  if (wallet.length === 0) {
    ul.innerHTML = "<li>No coins in your wallet yet.</li>";
    return;
  }

  const walletCoins = allCoins.filter((coin) => wallet.includes(coin.id));

  walletCoins.forEach((coin) => {
    const li = document.createElement("li");
    li.innerHTML = `
    <img src="${coin.image}" alt="${coin.name}" width="20"/>
    <strong>${coin.name}</strong> (${coin.symbol.toUpperCase()}) - ${
      coin.current_price
    }
    `;
    ul.appendChild(li);
  });
};

// Function to check if the coin is in wallet
const isCoinInWallet = (coinId) => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return false;

  const wallet =
    JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];
  return wallet.includes(coinId);
};

// Coin in Wallet Toggle
const toggleWallet = (coinId) => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("You need to log in first.");
    return;
  }

  let wallet = JSON.parse(localStorage.getItem(`${currentUser}_wallet`)) || [];

  if (wallet.includes(coinId)) {
    const confirmRemoval = confirm(
      "Are you sure you want to remove this coin from wallet?"
    );

    if (confirmRemoval) {
      wallet = wallet.filter((id) => id !== coinId);
      localStorage.setItem(`${currentUser}_wallet`, JSON.stringify(wallet));
      displayCrypto(allCoins);
    }
  } else {
    wallet.push(coinId);
    localStorage.setItem(`${currentUser}_wallet`, JSON.stringify(wallet));
    displayCrypto(allCoins);
  }
};

// Wallet List Toggle
document.getElementById("walletBtn").addEventListener("click", () => {
  const walletSection = document.getElementById("walletList");

  if (
    walletSection.style.display === "none" ||
    walletSection.innerHTML === ""
  ) {
    displayWallet();
    walletSection.style.display = "block";
  } else {
    walletSection.style.display = "none";
  }
});
