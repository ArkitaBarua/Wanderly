// scripts.js

// Import GSAP for animations
import { gsap } from "gsap";

// GSAP Animations
gsap.from(".hero h1", { duration: 1, y: -50, opacity: 0, ease: "power2.out" });
gsap.from(".hero p", { duration: 1, y: 50, opacity: 0, delay: 0.5, ease: "power2.out" });
gsap.from(".cta-buttons", { duration: 1, y: 50, opacity: 0, delay: 1, ease: "power2.out" });

// Feature Card Hover Effects
document.querySelectorAll(".feature-card").forEach(card => {
    card.addEventListener("mouseenter", () => {
        gsap.to(card, { scale: 1.05, duration: 0.3, ease: "power2.out" });
    });
    card.addEventListener("mouseleave", () => {
        gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
    });
});

// Real-Time Data Integration (Earthquake Data)
async function fetchEarthquakeData() {
    const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson");
    const data = await response.json();
    return data.features;
}

function displayEarthquakesOnMap(earthquakes) {
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    earthquakes.forEach(quake => {
        const { coordinates } = quake.geometry;
        const magnitude = quake.properties.mag;
        L.marker([coordinates[1], coordinates[0]]).addTo(map)
            .bindPopup(`Magnitude: ${magnitude}`)
            .openPopup();
    });
}

// Fetch and Display Earthquake Data
fetchEarthquakeData().then(displayEarthquakesOnMap);

// Authentication Logic (Signup and Login)
document.getElementById("signup-form") ? addEventListener("submit", async(e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    alert(await response.text());
});

document.getElementById("login-form") ? addEventListener("submit", async(e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
        localStorage.setItem("token", data.token);
        alert("Login successful");
    } else {
        alert("Login failed");
    }
});

// Chatbot Embedding (Dialogflow)
const chatbotIframe = document.createElement("iframe");
chatbotIframe.allow = "microphone";
chatbotIframe.width = "350";
chatbotIframe.height = "430";
chatbotIframe.src = "https://console.dialogflow.cloud.google.com/client/web/your-agent-id";
document.body.appendChild(chatbotIframe);

// Smooth Scrolling for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth"
        });
    });
});