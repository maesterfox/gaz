// Initialize the map
let mymap = L.map("mapid");

// Function to locate the user
function locateUser() {
  mymap.locate({ setView: true, maxZoom: 16 });
}

// Automatically locate the user upon loading
locateUser();

let userLocation;
let userLocationMarker;
let isGeolocationEnabled = true;
let isWeatherVisible = true;

// Add standard map layer
let standardLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
  }
).addTo(mymap);

// Add satellite layer
let satelliteLayer = L.tileLayer(
  "http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}",
  {
    maxZoom: 19,
  }
);

// Add EasyButton to toggle layers
L.easyButton({
  states: [
    {
      stateName: "show-standard",
      icon: "fa-map",
      title: "Show Standard Map",
      onClick: function (btn, map) {
        map.removeLayer(satelliteLayer);
        map.addLayer(standardLayer);
        btn.state("show-satellite");
      },
    },
    {
      stateName: "show-satellite",
      icon: "fa-globe",
      title: "Show Satellite Map",
      onClick: function (btn, map) {
        map.removeLayer(standardLayer);
        map.addLayer(satelliteLayer);
        btn.state("show-standard");
      },
    },
  ],
}).addTo(mymap);

// Replace 'My Location' button with EasyButton
L.easyButton(
  "fa-crosshairs",
  function (btn, map) {
    if (userLocation) {
      mymap.flyTo(userLocation, 13);
    } else {
      console.log("User location is not available");
    }
  },
  "Show Current Location"
).addTo(mymap);

// Function for current location
function onLocationFound(e) {
  userLocation = e.latlng;
  userLocationMarker = L.marker(e.latlng)
    .addTo(mymap)
    .bindPopup("You are here")
    .openPopup();
}

// Listen for the locationfound event
mymap.on("locationfound", onLocationFound);

// Add EasyButton for geolocation toggle
let geoButton = L.easyButton({
  states: [
    {
      stateName: "enable-geolocation",
      icon: "fa-circle-o",
      title: "Enable Geolocation",
      onClick: function (control) {
        mymap.locate({ setView: true, maxZoom: 16 });
        control.state("disable-geolocation");
      },
    },
    {
      stateName: "disable-geolocation",
      icon: "fa-dot-circle-o",
      title: "Disable Geolocation",
      onClick: function (control) {
        mymap.stopLocate();
        control.state("enable-geolocation");
      },
    },
  ],
}).addTo(mymap);

// Function to fetch weather data for the current location
function fetchWeatherForCurrentLocation() {
  if (userLocation) {
    const lat = userLocation.lat;
    const lon = userLocation.lng;

    // Fetch weather data using fetch_weather.php
    $.ajax({
      url: "./php/fetch_weather.php",
      type: "GET",
      dataType: "json",
      data: { lat: lat, lon: lon },
      success: function (data) {
        console.log("Weather data:", data);
        // Code to display the weather information
      },
      error: function (error) {
        console.error("Error fetching weather data: ", error);
      },
    });
  } else {
    console.log("User location is not available for fetching weather");
  }
}

// Add EasyButton for weather toggle
L.easyButton(
  "fa-cloud",
  function (btn, map) {
    if (isWeatherVisible) {
      // Code to hide weather information
      isWeatherVisible = false;
    } else {
      fetchWeatherForCurrentLocation();
      isWeatherVisible = true;
    }
  },
  "Toggle Weather"
).addTo(mymap);

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
