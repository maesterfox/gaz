// Initialize the map
let mymap = L.map("mapid");

// Function to locate the user
function locateUser() {
  mymap.locate({ setView: true, maxZoom: 13 });
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
      mymap.flyTo(userLocation, 18);
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
        mymap.locate({ setView: true, maxZoom: 13 });
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

  // Function to handle the search action
  function performSearch() {
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
            mymap.flyTo(latlng, 12);
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
  }

  // Add event listener for the search button click
  searchButton.addEventListener("click", performSearch);

  // Add event listener for the 'Enter' key press in the input field
  locationSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default behavior
      performSearch(); // Call the search function
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

// Function to fetch weather data and display it in the modal
function fetchWeatherForCentralLocation() {
  const center = mymap.getCenter(); // Get the central coordinates of the map
  const lat = center.lat;
  const lon = center.lng;

  // Fetch data using fetch_weather.php
  $.ajax({
    url: "./php/fetch_weather.php",
    type: "GET",
    dataType: "json",
    data: { lat: lat, lon: lon },
    success: function (data) {
      console.log("Weather data:", data.weatherData);

      // Check if weather data is available
      if (data.weatherData) {
        const weatherInfo = data.weatherData;
        const weatherModal = $("#weather-modal");

        // Calculate temperature in both Celsius and Fahrenheit
        const kelvinTemp = weatherInfo.main.temp;
        const celsiusTemp = (kelvinTemp - 273.15).toFixed(2);
        const fahrenheitTemp = ((celsiusTemp * 9) / 5 + 32).toFixed(2);

        // Populate the modal with weather information
        $("#weather1").html(
          `<h3>${weatherInfo.name}, ${weatherInfo.sys.country}</h3>`
        );
        $("#weather2").html(
          `<p>Temperature: ${celsiusTemp}°C / ${fahrenheitTemp}°F</p>`
        );
        $("#weather3").html(`<p>Humidity: ${weatherInfo.main.humidity}%</p>`);
        $("#weather4").html(
          `<p>Visibility: ${weatherInfo.visibility} meters</p>`
        );
        $("#weather5").html(
          `<p>Rain: ${
            weatherInfo.rain
              ? (weatherInfo.rain["1h"] || 0) + (weatherInfo.rain["3h"] || 0)
              : "0"
          } mm</p>`
        );
        $("#weather6").html(
          `<p>Snow: ${
            weatherInfo.snow
              ? (weatherInfo.snow["1h"] || 0) + (weatherInfo.snow["3h"] || 0)
              : "0"
          } mm</p>`
        );
        $("#weather7").html(
          `<p>Time of Calculation: ${new Date(
            weatherInfo.dt * 1000
          ).toLocaleTimeString()}</p>`
        );

        // Display the weather modal
        weatherModal.modal("show");
      } else {
        console.log("Weather data is not available.");
      }
    },
    error: function (error) {
      console.error("Error fetching data: ", error);
    },
  });
}

// Add EasyButton to trigger weather data fetching and display for the central location
L.easyButton(
  "fa-cloud",
  function (btn, map) {
    fetchWeatherForCentralLocation();
  },
  "Toggle Weather"
).addTo(mymap);

// Initialize an empty object to serve as the cache
let locationCache = {};

// Function to fetch Wikipedia information based on the central location
function fetchWikipediaForCentralLocation() {
  console.log("fetchWikipediaForCentralLocation called");
  const center = mymap.getCenter();
  const lat = center.lat.toFixed(4); // Round to 4 decimal places
  const lon = center.lng.toFixed(4); // Round to 4 decimal places
  const apiKey = "4fe0f4e6120b4529a33583954b82b56d"; // Replace with your OpenCage API key

  // Create a cache key based on the rounded latitude and longitude
  const cacheKey = `${lat},${lon}`;

  // Check if the location is already cached
  if (locationCache[cacheKey]) {
    fetchWikipedia(locationCache[cacheKey]);
    return;
  }

  // Reverse geocoding using OpenCage API
  $.ajax({
    url: `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`,
    type: "GET",
    success: function (geocodeResult) {
      const components = geocodeResult.results[0].components;
      const placeName = `${components.city}, ${components.country}`;

      // Cache the place name
      locationCache[cacheKey] = placeName;

      // Fetch Wikipedia information
      fetchWikipedia(placeName);
    },
    error: function (error) {
      console.error("Error in reverse geocoding: ", error);
    },
  });
}

// Function to fetch Wikipedia information based on place name
function fetchWikipedia(placeName) {
  $.ajax({
    url: "./php/fetch_wikipedia.php",
    type: "POST",
    dataType: "json",
    data: {
      q: placeName,
      maxRows: 1,
      lang: "en",
    },
    success: function (result) {
      console.log("Wikipedia API Response:", result);
      if (result.geonames && result.geonames.length > 0) {
        $("#wikipedia-title").html(result.geonames[0].title);
        $("#wikipedia-summary").html(result.geonames[0].summary);
        $("#wikipedia-modal").modal("show");
      } else {
        console.error("No geonames data found.");
      }
    },
    error: function (error) {
      console.error("Error fetching Wikipedia data: ", error);
    },
  });
}

// Initialize the EasyButton after the document is ready
$(document).ready(function () {
  console.log("Document ready, initializing button"); // Debugging line

  // Remove any existing EasyButtons
  if (mymap.easyButton) {
    mymap.removeControl(mymap.easyButton);
  }

  // Explicitly unbind any existing click events from the button
  $(document).off("click", ".leaflet-easyButton-button");

  // Create a new EasyButton
  mymap.easyButton = L.easyButton(
    "fa-wikipedia-w",
    function (btn, map) {
      console.log("Button clicked"); // Debugging line
      fetchWikipediaForCentralLocation();
    },
    "Toggle Wikipedia"
  ).addTo(mymap);

  // Log the current state of event listeners (for debugging)
  console.log($._data(document, "events"));
});
