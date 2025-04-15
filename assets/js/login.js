// Form Animation
const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

// Register Form
document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  const userData = {
    name: name,
    email: email,
    password: password,
  };

  // Save individual user data by email
  localStorage.setItem(email, JSON.stringify(userData));

  // Add user to allUsers list
  const allUsers = JSON.parse(localStorage.getItem("allUsers")) || [];

  // Check if user already exists in allUsers (for Email)
  const alreadyExists = allUsers.some((user) => user.email === email);
  if (!alreadyExists) {
    allUsers.push(userData);
    localStorage.setItem("allUsers", JSON.stringify(allUsers));
  }

  // Create empty wallet for new user
  const walletKey = `${email}_wallet`;
  if (!localStorage.getItem(walletKey)) {
    localStorage.setItem(walletKey, JSON.stringify([]));
  }

  // Reset form fields after successful registration
  document.getElementById("registerForm").reset();

  alert("Registration successful! You can now log in.");
});

// Login Form
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const storedData = localStorage.getItem(email);

  if (!storedData) {
    alert("User not found!");
    return;
  }

  const userData = JSON.parse(storedData);

  if (userData.password === password) {
    localStorage.setItem("currentUser", email);
    window.location.href = "index.html";
  } else {
    alert("Password Error!");
  }

  const walletKey = `${email}_wallet`;

  if (!localStorage.getItem(walletKey)) {
    localStorage.setItem(walletKey, JSON.stringify([]));
  }

  // Reset form fields after successful login
  document.getElementById("loginForm").reset();
});
