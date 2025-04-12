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

// Register
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

  const data = JSON.stringify(userData);
  localStorage.setItem(email, data);

  // Reset form fields after successful registration
  document.getElementById("registerForm").reset();
});

// Login
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

  // Reset form fields after successful login
  document.getElementById("loginForm").reset();
});

