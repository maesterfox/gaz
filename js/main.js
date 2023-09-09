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
            mymap.flyTo(latlng, 19);
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

// Function to fetch and display flight paths
function fetchFlightData(origin, destination) {
  console.log("Inside fetchFlightData function...");

  $.ajax({
    url: "./php/fetch_flights.php",
    type: "GET",
    success: function (data) {
      console.log("AJAX success, data fetched:", data);

      const parsedData = JSON.parse(data); // Assuming the data is in JSON format
      console.log(
        "Type of parsedData:",
        typeof parsedData,
        "Content:",
        parsedData
      );

      if (Array.isArray(parsedData.states)) {
        // Filter flights based on origin and destination
        const relevantFlights = parsedData.states.filter((flight) => {
          return (
            flight[originIndex] === origin &&
            flight[destinationIndex] === destination
          );
        });

        // Display the relevant flights on the map
        relevantFlights.forEach((flight) => {
          // Create a marker for each flight (replace latIndex, lngIndex with actual indices)
          const marker = L.marker([flight[latIndex], flight[lngIndex]]).addTo(
            mymap
          );

          // Add a popup to the marker
          marker
            .bindPopup(
              `Flight Number: ${flight[flightNumberIndex]}<br>Origin: ${flight[originIndex]}<br>Destination: ${flight[destinationIndex]}`
            )
            .openPopup();
        });
      } else {
        console.log(
          "parsedData.states is not an array. Cannot proceed with filtering."
        );
      }
    },
    error: function (error) {
      console.error("AJAX error:", error);
    },
  });
}

// Create a popup form
const popupContent = `
  <form id="flightForm">
    Origin: <input type="text" id="origin"><br>
    Destination: <input type="text" id="destination"><br>
    <button type="button" id="submitFlight">Submit</button>
  </form>
`;

// Add EasyButton for flight paths
const flightButton = L.easyButton(
  "fa-plane",
  function (btn, map) {
    console.log("EasyButton clicked");

    const popup = L.popup()
      .setLatLng(map.getCenter())
      .setContent(popupContent)
      .openOn(map);
  },
  "Show Flight Paths"
).addTo(mymap);

// Use event delegation to handle the submit button click
document.addEventListener("click", function (event) {
  if (event.target.id === "submitFlight") {
    console.log("Submit button clicked");

    const origin = document.getElementById("origin").value;
    const destination = document.getElementById("destination").value;
    fetchFlightData(origin, destination);

    mymap.closePopup();
  }
});

// Function to fetch warzones data
function fetchWarzones() {
  $.ajax({
    url: "./php/fetch_warzones.php",
    type: "GET",
    dataType: "json",
    success: function (data) {
      // Display warzones data (you can modify this part based on your needs)
      console.log("Warzones data:", data);
      // Code to display the warzones information in your modal or any other UI element
    },
    error: function (error) {
      console.error("Error fetching warzones data:", error);
    },
  });
}

// Add EasyButton for warzones toggle
L.easyButton(
  "fa-bomb",
  function (btn, map) {
    fetchWarzones();
  },
  "Show Warzones"
).addTo(mymap);

// Function to fetch and display routes
function runDirection(start, end) {
  // recreating new map layer after removal
  map = L.map("map", {
    layers: MQ.mapLayer(),
    center: [35.791188, -78.636755],
    zoom: 12,
  });

  var dir = MQ.routing.directions();

  dir.route({
    locations: [start, end],
  });

  CustomRouteLayer = MQ.Routing.RouteLayer.extend({
    createStartMarker: (location) => {
      var custom_icon;
      var marker;

      custom_icon = L.icon({
        iconUrl: "img/red.png",
        iconSize: [20, 29],
        iconAnchor: [10, 29],
        popupAnchor: [0, -29],
      });

      marker = L.marker(location.latLng, { icon: custom_icon }).addTo(map);

      return marker;
    },

    createEndMarker: (location) => {
      var custom_icon;
      var marker;

      custom_icon = L.icon({
        iconUrl: "img/blue.png",
        iconSize: [20, 29],
        iconAnchor: [10, 29],
        popupAnchor: [0, -29],
      });

      marker = L.marker(location.latLng, { icon: custom_icon }).addTo(map);

      return marker;
    },
  });

  map.addLayer(
    new CustomRouteLayer({
      directions: dir,
      fitBounds: true,
    })
  );
}

// function that runs when form submitted
function submitForm(event) {
  event.preventDefault();

  // delete current map layer
  map.remove();

  // getting form data
  start = document.getElementById("start").value;
  end = document.getElementById("destination").value;

  // run directions function
  runDirection(start, end);

  // reset form
  document.getElementById("form").reset();
}

// asign the form to form variable
const form = document.getElementById("form");

// call the submitForm() function when submitting the form
form.addEventListener("submit", submitForm);

// Add EasyButton for warzones toggle
L.easyButton(
  "fa-map",
  function (btn, map) {
    fetchWarzones();
  },
  "Show MapForm"
).addTo(mymap);
