// ================= Shared Constants =================
// Defined ONCE here — reused by signup, reset_password, and profile.html (no more copy-paste)
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

// ================= Utility Functions =================
function generateOTP(length = 6) {
    let otp = "";
    for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
    return otp;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

function validatePhone(phone) {
    let cleaned = phone.replace(/[\s\-()]/g, "");
    if (cleaned.startsWith("+91")) cleaned = cleaned.slice(3);
    else if (cleaned.startsWith("91")) cleaned = cleaned.slice(2);
    return /^[6-9]\d{9}$/.test(cleaned);
}

function getAllUsers() {
    const raw = localStorage.getItem("rr_users");
    return raw ? JSON.parse(raw) : [];
}

function saveUser(user) {
    const users = getAllUsers();
    users.push(user);
    localStorage.setItem("rr_users", JSON.stringify(users));
}

// ================= Signup =================
function get_otp(event) {
    if (event) event.preventDefault();

    const form = document.querySelector(".login-form");
    const formData = new FormData(form);
    const name     = formData.get("name").trim();
    const username = formData.get("username").trim();
    const phone    = formData.get("phone_number").trim();
    const email    = formData.get("email_address").trim();
    const password = formData.get("creat_password").trim();
    const confirm  = formData.get("conform_password").trim();

    if (!name)     return alert("Please enter your name.");
    if (!username) return alert("Please enter a username.");
    if (!validatePhone(phone))  return alert("Invalid phone number.");
    if (!validateEmail(email))  return alert("Invalid email address.");
    if (!STRONG_PASSWORD_RE.test(password))
        return alert("Password must be at least 6 characters and include uppercase, lowercase, number, and special character.");
    if (password !== confirm) return alert("Passwords do not match.");

    const users = getAllUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return alert("Username already taken.");
    if (users.some(u => u.email.toLowerCase()    === email.toLowerCase()))    return alert("Email already registered.");
    if (users.some(u => u.phone === phone))                                   return alert("Phone number already registered.");

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    localStorage.setItem(
        "rr_signup_temp",
        JSON.stringify({ otp, expiresAt, user: { name, username, phone, email, password } })
    );

    alert(`OTP sent to ${phone} and ${email}.\n(Dev only: OTP = ${otp})`);
    window.location.href = "./singup_verification.html";
}

function verifyOTP(event) {
    if (event) event.preventDefault();

    const stored = JSON.parse(localStorage.getItem("rr_signup_temp"));
    if (!stored) {
        alert("No signup data found. Please start signup again.");
        window.location.href = "./sing_up.html";
        return;
    }

    const otpInput = document.querySelector("input[name='Otp']").value.trim();
    if (!otpInput)                  return alert("Please enter the OTP.");
    if (Date.now() > stored.expiresAt) return alert("OTP has expired.");
    if (otpInput !== stored.otp)    return alert("Incorrect OTP.");

    saveUser(stored.user);
    localStorage.removeItem("rr_signup_temp");
    alert("✅ OTP Verified & Signup Successful!");
    window.location.href = "../index.html";
}

function resend_otp() {
    const stored = JSON.parse(localStorage.getItem("rr_signup_temp"));
    if (!stored) return alert("Please sign up first.");

    const otp = generateOTP();
    stored.otp = otp;
    stored.expiresAt = Date.now() + 5 * 60 * 1000;
    localStorage.setItem("rr_signup_temp", JSON.stringify(stored));

    alert(`A new OTP has been sent!\n(Dev only: OTP = ${otp})`);
}

// ================= Login =================
function login(event) {
    if (event) event.preventDefault();

    const usernameInput = document.querySelector("input[name='username']").value.trim();
    const passwordInput = document.querySelector("input[name='password']").value.trim();

    if (!usernameInput || !passwordInput) {
        return alert("Please enter both username and password.");
    }

    const users = getAllUsers();
    const user  = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());

    if (!user)                        return alert("Username not found. Please sign up.");
    if (user.password !== passwordInput) return alert("Incorrect password. Try again.");

    // FIX: persist session so profile.html can identify who is logged in
    localStorage.setItem("rr_current_user", user.username);
    window.location.href = "./HTML/movies/movie_main.html";
}

// ================= Forgot Password =================
function sendotp(event) {
    if (event) event.preventDefault();
    const phoneInput = document.querySelector("input[name='Phone Number']").value.trim();

    if (!validatePhone(phoneInput)) return alert("Please enter a valid 10-digit Indian phone number.");
    const users = getAllUsers();
    if (!users.some(u => u.phone === phoneInput)) return alert("Phone number not found.");

    const otp = generateOTP();
    localStorage.setItem(
        "forgot_otp",
        JSON.stringify({ phone: phoneInput, otp, expiresAt: Date.now() + 5 * 60 * 1000 })
    );

    alert(`OTP sent successfully!\n(Dev only: OTP = ${otp})`);
}

function OTP_verification(event) {
    if (event) event.preventDefault();
    const enteredOtp = document.querySelector("input[name='Otp']").value.trim();
    const stored = JSON.parse(localStorage.getItem("forgot_otp"));
    if (!stored)                        return alert("Please request OTP first.");
    if (Date.now() > stored.expiresAt)  return alert("OTP expired.");
    if (enteredOtp !== stored.otp)      return alert("Incorrect OTP.");

    alert("OTP verified! You can now reset your password.");
    window.location.href = "./reset_password.html";
}

function resendForgotOTP(event) {
    if (event) event.preventDefault();
    const stored = JSON.parse(localStorage.getItem("forgot_otp"));
    if (!stored) return alert("Please request OTP first.");

    const otp = generateOTP();
    stored.otp = otp;
    stored.expiresAt = Date.now() + 5 * 60 * 1000;
    localStorage.setItem("forgot_otp", JSON.stringify(stored));

    alert(`New OTP sent!\n(Dev only: OTP = ${otp})`);
}

// ================= Reset Password =================
function reset_password(event) {
    if (event) event.preventDefault();
    const newPassword     = document.querySelector("input[name='new_password']").value.trim();
    const confirmPassword = document.querySelector("input[name='confirm_password']").value.trim();

    // FIX: use shared constant instead of re-declaring the regex
    if (!STRONG_PASSWORD_RE.test(newPassword))
        return alert("Password must be at least 6 characters and include uppercase, lowercase, number, and special character.");
    if (newPassword !== confirmPassword) return alert("Passwords do not match.");

    const users = getAllUsers();
    const phone = JSON.parse(localStorage.getItem("forgot_otp"))?.phone;
    if (!phone) return alert("Something went wrong.");

    const userIndex = users.findIndex(u => u.phone === phone);
    if (userIndex === -1) return alert("User not found.");

    users[userIndex].password = newPassword;
    localStorage.setItem("rr_users", JSON.stringify(users));
    localStorage.removeItem("forgot_otp");

    alert("✅ Password reset successful!");
    window.location.href = "../index.html";
}

// ================= Sidenav =================
// These are called directly from onclick="" in HTML so must stay at top-level scope.
function openSidenav() {
    const sidenav = document.getElementById("sidenav");
    const overlay = document.getElementById("overlay");
    const main    = document.getElementById("main");
    if (!sidenav || !overlay || !main) return;

    sidenav.style.width = window.innerWidth <= 768 ? "45%" : "250px";
    overlay.classList.add("open");
    if (window.innerWidth > 768) main.style.marginLeft = "250px";
}

function closeSidenav() {
    const sidenav = document.getElementById("sidenav");
    const overlay = document.getElementById("overlay");
    const main    = document.getElementById("main");
    if (!sidenav || !overlay || !main) return;

    sidenav.style.width = "0";
    overlay.classList.remove("open");
    main.style.marginLeft = "0";
}

function goBack()  { window.history.back(); }
function goNext()  { window.history.forward(); }

// ================= DOM Listeners =================
document.addEventListener("DOMContentLoaded", () => {

    const overlay = document.getElementById("overlay");
    const main    = document.getElementById("main");

    window.addEventListener("resize", () => {
        if (window.innerWidth <= 768 && main) main.style.marginLeft = "0";
    });

    if (overlay) overlay.addEventListener("click", closeSidenav);

    if (main) {
        main.addEventListener("click", () => {
            if (overlay && overlay.classList.contains("open")) closeSidenav();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay && overlay.classList.contains("open")) closeSidenav();
    });

    // ---- Search (only activates on pages with a search form) ----
    const searchForm  = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    if (!searchForm || !searchInput || !main) return;

    // ---- Search History ----
    const HISTORY_KEY = "rr_search_history";
    const MAX_HISTORY = 10;

    function getHistory() {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    }

    function saveToHistory(query) {
        let history = getHistory().filter(q => q !== query);
        history.unshift(query);
        if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function removeFromHistory(query) {
        const updated = getHistory().filter(q => q !== query);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }

    // ---- History Dropdown ----
    const historyDropdown = document.createElement("div");
    historyDropdown.id = "search-history-dropdown";
    historyDropdown.style.display = "none";
    searchForm.parentElement.style.position = "relative";
    searchForm.parentElement.appendChild(historyDropdown);

    function renderHistoryDropdown() {
        const history = getHistory();
        if (history.length === 0) { historyDropdown.style.display = "none"; return; }

        const preview = history.slice(0, 2);
        const hasMore = history.length > 2;

        historyDropdown.innerHTML = `
            <div class="sh-header">
                <span class="sh-label"><i class="fa-solid fa-clock-rotate-left"></i> Recent Searches</span>
            </div>
            <ul class="sh-list">
                ${preview.map(q => `
                    <li class="sh-item" data-query="${q}">
                        <span class="sh-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
                        <span class="sh-text">${q}</span>
                        <button class="sh-remove" data-query="${q}" title="Remove">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </li>`).join("")}
            </ul>
            <div class="sh-footer">
                <a href="search_history.html" class="sh-see-all">
                    ${hasMore ? `See all ${history.length} searches` : "View history"}
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        `;
        historyDropdown.style.display = "block";

        historyDropdown.querySelectorAll(".sh-item").forEach(item => {
            item.addEventListener("click", (e) => {
                if (e.target.closest(".sh-remove")) return;
                const q = item.dataset.query;
                searchInput.value = q;
                historyDropdown.style.display = "none";
                searchMovies(q);
            });
        });

        historyDropdown.querySelectorAll(".sh-remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                removeFromHistory(btn.dataset.query);
                renderHistoryDropdown();
                if (getHistory().length === 0) historyDropdown.style.display = "none";
            });
        });
    }

    searchInput.addEventListener("focus", () => {
        if (!searchInput.value.trim() && getHistory().length > 0) renderHistoryDropdown();
    });

    document.addEventListener("click", (e) => {
        if (!searchForm.parentElement.contains(e.target)) historyDropdown.style.display = "none";
    });

    // ---- Search Results Section ----
    const searchSection = document.createElement("div");
    searchSection.id = "search-results-section";
    searchSection.style.display = "none";
    searchSection.innerHTML = `
        <div class="nav-buttons">
            <button class="btn-bn btn-left" onclick="goBack()">
                <i class="fa-solid fa-circle-chevron-left"></i>
            </button>
            <button class="btn-bn btn-right" onclick="goNext()">
                <i class="fa-solid fa-circle-chevron-right"></i>
            </button>
        </div>
        <header>
            <h1 id="search-results-title">Search Results</h1>
        </header>
        <div class="movie-grid" id="search-results-container"></div>
    `;
    main.prepend(searchSection);

    function getOriginalSections() {
        return [...main.children].filter(el => el.id !== "search-results-section");
    }

    function showResults(results, query) {
        const container = document.getElementById("search-results-container");
        const title     = document.getElementById("search-results-title");
        container.innerHTML = "";

        if (results.length === 0) {
            title.innerHTML = `Results for <span style="color:var(--primary-accent)">"${query}"</span>`;
            container.innerHTML = `
                <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;
                            gap:14px;padding:60px 20px;color:#888;text-align:center;">
                    <i class="fa-solid fa-film" style="font-size:3rem;color:#444;"></i>
                    <p style="margin:0;font-size:1rem;color:#aaa;">
                        No results found for <strong style="color:var(--primary-accent)">"${query}"</strong>
                    </p>
                    <p style="margin:0;font-size:0.85rem;color:#666;">
                        Try searching by title, category, language, or year
                    </p>
                </div>`;
        } else {
            title.innerHTML = `Results for <span style="color:var(--primary-accent)">"${query}"</span>
                <span style="font-size:1rem;font-weight:400;color:#aaa;margin-left:10px;">${results.length} found</span>`;
            results.forEach(m => renderMovieCard(m, container));
        }

        getOriginalSections().forEach(el => el.style.display = "none");
        searchSection.style.display = "block";
        document.querySelector("footer").style.display = "none";
    }

    function clearSearch() {
        getOriginalSections().forEach(el => el.style.display = "");
        searchSection.style.display = "none";
        document.getElementById("search-results-container").innerHTML = "";
        document.querySelector("footer").style.display = "";
    }

    function searchMovies(query) {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) { clearSearch(); return; }

        const results = movies.filter(movie =>
            movie.title.toLowerCase().includes(trimmed)    ||
            movie.category.toLowerCase().includes(trimmed) ||
            movie.language.toLowerCase().includes(trimmed) ||
            String(movie.year).includes(trimmed)
        );
        showResults(results, trimmed);
    }

    // Save to history only on explicit form submit
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = searchInput.value.trim().toLowerCase();
        if (q) saveToHistory(q);
        historyDropdown.style.display = "none";
        searchMovies(q);
    });

    // Live search while typing — does not save to history
    searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim();
        if (q) {
            historyDropdown.style.display = "none";
        } else {
            renderHistoryDropdown();
        }
        searchMovies(searchInput.value);
    });

    // Auto-run search if redirected from history page (?search=query)
    const urlParams  = new URLSearchParams(window.location.search);
    const autoSearch = urlParams.get("search");
    if (autoSearch) {
        searchInput.value = autoSearch;
        searchMovies(autoSearch);
        window.history.replaceState({}, "", window.location.pathname);
    }
});