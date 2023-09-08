// main.js

// Initialize the map
let mymap = L.map("mapid").setView([51.505, -0.09], 13);
let userLocation;
let userLocationMarker; // Declare a variable to store the user location marker
let isGeolocationEnabled = false; // Initialize geolocation status
let isWeatherVisible = false;

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(mymap);

// Initialize the button to red and 'Disabled'
document.getElementById("allow-button").classList.add("btn-danger");
document.getElementById("allow-button").classList.remove("btn-primary");
document.getElementById("allow-button").textContent =
  "Toggle Geolocation (Disabled)";

// Function for current location
function onLocationFound(e) {
  userLocation = e.latlng;
  userLocationMarker = L.marker(e.latlng)
    .addTo(mymap)
    .bindPopup("You are here")
    .openPopup(); // Store the marker

  // Change the button to green and 'Enabled'
  document.getElementById("allow-button").classList.remove("btn-danger");
  document.getElementById("allow-button").classList.add("btn-success");
  document.getElementById("allow-button").textContent =
    "Toggle Geolocation (Enabled)";
  isGeolocationEnabled = true;
}

function onLocationError(e) {
  console.log("Error occurred: ", e.message);

  // Change the button to red and 'Disabled'
  document.getElementById("allow-button").classList.remove("btn-success");
  document.getElementById("allow-button").classList.add("btn-danger");
  document.getElementById("allow-button").textContent =
    "Toggle Geolocation (Disabled)";
  isGeolocationEnabled = false;
}

// Toggle geolocation when clicking the button
document.getElementById("allow-button").addEventListener("click", function () {
  if (isGeolocationEnabled) {
    mymap.stopLocate();
    if (userLocationMarker) {
      mymap.removeLayer(userLocationMarker); // Remove the marker
    }

    // Change the button to red and 'Disabled'
    document.getElementById("allow-button").classList.remove("btn-success");
    document.getElementById("allow-button").classList.add("btn-danger");
    document.getElementById("allow-button").textContent =
      "Toggle Geolocation (Disabled)";
    isGeolocationEnabled = false;
  } else {
    mymap.locate({ setView: true, maxZoom: 16 });
    // The button will turn green in the onLocationFound function
  }
  $("#allowModal").modal("hide"); // Hide the modal
});

mymap.on("locationfound", onLocationFound);
mymap.on("locationerror", onLocationError);

// Custom Marker
let customMarker = L.icon({
  iconUrl: "located.gif",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

let cities = new L.LayerGroup();

// Function to populate cities dynamically
function populateCities(dataArray) {
  dataArray.forEach((city) => {
    const marker = L.marker([city.lat, city.lon], { icon: customMarker });
    marker.bindPopup(city.popupContent);
    marker.addTo(cities);
    marker.options.popupContent = city.popupContent;
  });
  cities.addTo(mymap);
}

// Initialize search button, location button, and input field
document.addEventListener("DOMContentLoaded", function () {
  const searchButton = document.getElementById("search-button");
  const locationSearch = document.getElementById("location-search");

  searchButton.addEventListener("click", function () {
    const query = locationSearch.value.trim();

    if (query) {
      // Fetch geolocation using OpenCage API
      $.ajax({
        url: "./php/fetch_opencage.php",
        type: "GET",
        dataType: "json",
        data: { query: query },
        success: function (data) {
          if (data.results && data.results.length > 0) {
            const cityInfo = data.results[0];
            const latlng = [cityInfo.geometry.lat, cityInfo.geometry.lng];
            mymap.flyTo(latlng, 13);
          } else {
            console.log("No results found");
          }
        },
        error: function (error) {
          console.error("Error fetching OpenCage data: ", error);
        },
      });
    } else {
      console.log("Search query is empty");
    }
  });

  // Action for Return to My Location modal button
  document.getElementById("returnBtn").addEventListener("click", function () {
    if (userLocation) {
      mymap.flyTo(userLocation, 13);
      $("#returnModal").modal("hide"); // Hide the modal
    } else {
      console.log("User location is not available");
    }
  });
});
