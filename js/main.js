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

// Function to fetch Wikipedia information for the current location
function fetchWikipediaInfoForCentralLocation() {
  const center = mymap.getCenter(); // Get the central coordinates of the map
  const lat = center.lat;
  const lon = center.lng;

  // Fetch Wikipedia information using your PHP script
  $.ajax({
    url: "./php/fetch_wikipedia.php",
    type: "GET",
    dataType: "json",
    data: { q: `${lat},${lon}`, maxRows: 1 }, // Pass the coordinates to your PHP script
    success: function (data) {
      console.log("Wikipedia data:", data.geonames);

      // Check if Wikipedia data is available
      if (data.geonames.length > 0) {
        const wikipediaInfo = data.geonames[0];
        const wikipediaModal = $("#wikipedia-modal");

        // Populate the modal with Wikipedia information
        $("#wikipedia-title").html(`<h3>${wikipediaInfo.title}</h3>`);
        $("#wikipedia-summary").html(`<p>${wikipediaInfo.summary}</p>`);

        // Display the Wikipedia modal
        wikipediaModal.modal("show");
      } else {
        console.log("Wikipedia data is not available for this location.");
      }
    },
    error: function (error) {
      console.error("Error fetching Wikipedia data: ", error);
    },
  });
}

// Add EasyButton for Wikipedia information retrieval
L.easyButton({
  states: [
    {
      stateName: "fetch-wikipedia",
      icon: "fa-wikipedia-w",
      title: "Fetch Wikipedia Information",
      onClick: function (btn, map) {
        fetchWikipediaInfoForCentralLocation(); // Call the function to fetch Wikipedia info
      },
    },
  ],
}).addTo(mymap);
