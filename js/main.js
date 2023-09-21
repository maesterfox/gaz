// Base APIHandler Class
class APIHandler {
  makeAjaxCall(url, type, dataType, data, successCallback, errorCallback) {
    $.ajax({
      url: url,
      type: type,
      dataType: dataType,
      data: data,
      success: successCallback,
      error: errorCallback,
    });
  }
}

// WeatherAPI Class
class WeatherAPI extends APIHandler {
  fetchWeatherForCentralLocation(map) {
    const center = map.getCenter();
    const lat = center.lat;
    const lon = center.lng;
    this.makeAjaxCall(
      "./php/fetch_weather.php",
      "GET",
      "json",
      { lat: lat, lon: lon },
      function (data) {
        console.log("Weather data:", data.weatherData);

        if (data.weatherData) {
          const weatherInfo = data.weatherData;
          const weatherModal = $("#weather-modal");
          const kelvinTemp = weatherInfo.main.temp;
          const celsiusTemp = (kelvinTemp - 273.15).toFixed(2);
          const fahrenheitTemp = ((celsiusTemp * 9) / 5 + 32).toFixed(2);
          const iconCode = weatherInfo.weather[0].icon; // Assuming the icon code is in the first element of the 'weather' array
          const iconUrl = `http://openweathermap.org/img/wn/${iconCode}.png`;

          $("#weather1").html(
            `<img src="${iconUrl}" width="150" height="150">
            <h3>${weatherInfo.name}, ${weatherInfo.sys.country}</h3>`
          );
          $("#weather2").html(
            `<p>Temperature: ${celsiusTemp}°C / ${fahrenheitTemp}°F</p>`
          );
          $("#weather3").html(`<p>Humidity: ${weatherInfo.main.humidity}%</p>`);

          $("#weather4").html(
            `<h4>Current Weather: ${weatherInfo.weather[0].description}</h4>`
          );
          $("#weather5").html(`<p>Wind: ${weatherInfo.wind.speed} mph</p>`);
          $("#weather6").html(`<p>Clouds: ${weatherInfo.clouds.all}</p>`);

          weatherModal.modal("show");
        } else {
          console.log("Weather data is not available.");
        }
      },
      function (error) {
        console.error("Error fetching data: ", error);
      }
    );
  }
}

// WikipediaAPI Class
class WikipediaAPI extends APIHandler {
  constructor() {
    super();
    this.locationCache = {};
  }

  fetchWikipediaForCentralLocation(map, lat = null, lon = null) {
    console.log("fetchWikipediaForCentralLocation called");
    if (!lat || !lon) {
      const center = map.getCenter();
      lat = center.lat.toFixed(6);
      lon = center.lng.toFixed(6);
    }

    console.log("Sending lat:", lat, " lon:", lon);
    this.makeAjaxCall(
      "./php/fetch_wikipedia.php", // Your PHP file path
      "GET",
      "json",
      { lat: lat, lon: lon }, // Pass parameters to PHP
      (result) => {
        console.log(result);
        if (
          result.placeInfo &&
          result.placeInfo.geonames &&
          result.placeInfo.geonames.length > 0
        ) {
          const placeName = result.placeInfo.geonames[0].adminName1;
          const countryName = result.placeInfo.geonames[0].countryName;

          let title = "Unknown";
          let wikipediaSummary = "No information available.";

          if (
            result.wikipediaInfo &&
            result.wikipediaInfo.geonames &&
            result.wikipediaInfo.geonames.length > 0
          ) {
            title = result.wikipediaInfo.geonames[0].title;
            wikipediaSummary = result.wikipediaInfo.geonames[0].summary;
          }

          let infoHtml = '<div><img src="lost.gif" width="150" height="150">';

          if (title !== "Unknown") {
            infoHtml += `<h2>${title}</h2>`;
          }

          if (placeName) {
            infoHtml += `<h3>${placeName}</h3>`;
          }

          if (countryName) {
            infoHtml += `<h4>${countryName}</h4>`;
          }

          if (wikipediaSummary !== "No information available.") {
            infoHtml += `<p>${wikipediaSummary}</p>`;
          }

          if (result.placeInfo.geonames[0].name) {
            infoHtml += `<p>Village/Town: ${result.placeInfo.geonames[0].name}</p>`;
          }

          infoHtml += `<p>Coordinates: ${result.placeInfo.geonames[0].lat}, ${result.placeInfo.geonames[0].lng}</p>`;
          infoHtml += "</div>";

          $("#wikipedia-summary").html(infoHtml);
          $("#wikipedia-modal").modal("show");
        } else {
          console.error("No geonames data found.");
        }
      }
    );
  }
}

// GeoNamesAPI Class
class GeoNamesAPI extends APIHandler {
  constructor() {
    super();
    this.locationCache = {};
    this.markerClusterGroups = {};
    this.areAirportsDisplayed = false;
    this.airportMarkers = [];
    this.map = null; // Store the map reference
    this.areLandmarksDisplayed = false; // New state variable for landmarks
    this.landmarkMarkers = [];
    this.areUniversitiesDisplayed = false; // New state variable for universitys
    this.universityMarkers = []; // New array to store university markers
  }

  // In GeoNamesAPI class

  fetchCitiesAndAirports(countryCode) {
    // Get the map center
    const center = this.map.getCenter();
    const lat = center.lat;
    const lng = center.lng;

    // Check if airports are currently displayed
    if (this.areAirportsDisplayed) {
      // Airports are displayed, so remove them from the map
      this.airportMarkers.forEach((marker) => {
        this.map.removeLayer(marker);
      });
      this.airportMarkers = []; // Clear the airport markers
      this.areAirportsDisplayed = false; // Update the display state to false
    } else {
      // Airports are not displayed, so fetch and display them
      $.ajax({
        url: "./php/fetch_geonames.php",
        type: "GET",
        dataType: "json",
        data: {
          featureCode: "AIRP",
          maxRows: 50, // Limit to 50 airports
          lat: lat,
          lng: lng, // Pass the central location coordinates
        },
        success: (data) => {
          console.log(data);

          // Create a custom icon for the airplane
          const customIcon = L.icon({
            iconUrl: "./plane.png",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          // Add new airport markers
          data.geonames.forEach((airport) => {
            const marker = L.marker([airport.lat, airport.lng], {
              icon: customIcon,
            }).addTo(this.map);
            marker.bindPopup(
              `<b>${airport.name}</b><br>${airport.countryName}`
            );
            this.airportMarkers.push(marker);
          });

          // Update the display state
          this.areAirportsDisplayed = true;
        },
        error: (error) => {
          console.error("Error fetching airports: ", error);
        },
      });
    }
  }

  addCitiesAndAirportsButton(map) {
    this.map = map;

    L.easyButton({
      states: [
        {
          stateName: "show-cities-and-airports",
          icon: '<img src="plane.gif" width="20" height="20">',
          title: "Toggle Cities and Airports",
          onClick: (btn) => {
            this.fetchCitiesAndAirports();
          },
        },
      ],
    }).addTo(map);
  }

  clearLandmarks(map) {
    this.landmarkMarkers.forEach((marker) => {
      map.removeLayer(marker);
    });
    this.landmarkMarkers = [];
  }

  toggleLandmarkDisplay() {
    this.areLandmarksDisplayed = !this.areLandmarksDisplayed;
  }

  toggleUniversityDisplay() {
    this.areUniversitiesDisplayed = !this.areUniversitiesDisplayed;
  }
  clearUniversities(map) {
    this.universityMarkers.forEach((marker) => {
      map.removeLayer(marker);
    });
    this.universityMarkers = [];
  }

  // Inside the GeoNamesAPI class
  fetchHistoricalLandmarks(map, wikipediaAPI) {
    console.log(map, wikipediaAPI);

    // If landmarks are already displayed, remove them
    if (this.areLandmarksDisplayed) {
      this.landmarkMarkers.forEach((marker) => {
        map.removeLayer(marker);
      });
      this.landmarkMarkers = [];
      this.areLandmarksDisplayed = false;
    } else {
      const featureCode = "CSTL"; // Feature code for historical landmarks
      const iconUrl = "./img/castle.gif"; // Icon URL for historical landmarks
      const maxRows = 50; // Limit to 50 landmarks
      const bounds = map.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const landmarkIcon = L.icon({
        iconUrl: iconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const bbox = {
        north: northEast.lat,
        south: southWest.lat,
        east: northEast.lng,
        west: southWest.lng,
      };

      // Fetch historical landmarks using GeoNames API
      $.ajax({
        url: "./php/fetch_geonames.php",
        type: "GET",
        dataType: "json",
        data: { featureCode: featureCode, maxRows: maxRows, bbox: bbox },
        success: (result) => {
          console.log(result);
          if (result.geonames && result.geonames.length > 0) {
            const landmarks = result.geonames;
            landmarks.forEach((landmark) => {
              const popupContent = document.createElement("div");
              const title = document.createElement("h3");
              title.textContent = landmark.name;

              // Create a button to fetch Wikipedia data
              const triggerWikipediaButton = document.createElement("button");
              triggerWikipediaButton.textContent = "Wikipedia";
              triggerWikipediaButton.addEventListener("click", () => {
                map.panTo([landmark.lat, landmark.lng]); // Center the map to the landmark
                wikipediaAPI.fetchWikipediaForCentralLocation(
                  map,
                  landmark.lat,
                  landmark.lng
                );
              });

              // Create Zoom button
              const zoomButton = document.createElement("button");
              zoomButton.textContent = "Zoom In";
              zoomButton.addEventListener("click", () =>
                map.setView([landmark.lat, landmark.lng], 17)
              );

              // Append buttons to popup content
              popupContent.appendChild(title);
              popupContent.appendChild(triggerWikipediaButton);
              popupContent.appendChild(zoomButton);

              const marker = L.marker([landmark.lat, landmark.lng], {
                icon: landmarkIcon,
              }).addTo(map);
              marker.bindPopup(popupContent);
              this.landmarkMarkers.push(marker); // Store the marker
            });
            this.areLandmarksDisplayed = true; // Update the display state
          } else {
            console.error("No historical landmarks found.");
          }
        },
      });
    }
  }

  // Inside the GeoNamesAPI class
  async fetchInsaneUniversities(map, wikipediaAPI) {
    // This is actually Universities and will be updated
    if (this.areUniversitiesDisplayed) {
      this.universityMarkers.forEach((marker) => {
        map.removeLayer(marker);
      });
      this.universityMarkers = [];
      this.areUniversitiesDisplayed = false;
    } else {
      const featureCode = "UNIV"; // Feature code for insane universitys
      const iconUrl = "./img/uni.gif"; // Icon URL for insane universitys
      const maxRows = 100; // Limit to 50 universitys
      const bounds = map.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const universityIcon = L.icon({
        iconUrl: iconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const bbox = {
        north: northEast.lat,
        south: southWest.lat,
        east: northEast.lng,
        west: southWest.lng,
      };

      $.ajax({
        url: "./php/fetch_geonames.php",
        type: "GET",
        dataType: "json",
        data: { featureCode: featureCode, maxRows: maxRows, bbox: bbox },
        success: (result) => {
          console.log(result);
          if (result.geonames && result.geonames.length > 0) {
            const universitys = result.geonames;
            universitys.forEach((university) => {
              const popupContent = document.createElement("div");
              const title = document.createElement("h3");
              title.textContent = university.name;

              // Create a button to fetch Wikipedia data
              const triggerWikipediaButton = document.createElement("button");
              triggerWikipediaButton.textContent = "Wikipedia";
              triggerWikipediaButton.addEventListener("click", () => {
                map.panTo([university.lat, university.lng]); // Center the map to the university
                wikipediaAPI.fetchWikipediaForCentralLocation(
                  map,
                  university.lat,
                  university.lng
                );
              });

              // Create Zoom button
              const zoomButton = document.createElement("button");
              zoomButton.textContent = "Zoom In";
              zoomButton.addEventListener("click", () =>
                map.setView([university.lat, university.lng], 17)
              );

              // Append buttons to popup content
              popupContent.appendChild(title);
              popupContent.appendChild(triggerWikipediaButton);
              popupContent.appendChild(zoomButton);

              const marker = L.marker([university.lat, university.lng], {
                icon: universityIcon,
              }).addTo(map);
              marker.bindPopup(popupContent);
              this.universityMarkers.push(marker); // Store the marker
            });
            this.areUniversitiesDisplayed = true; // Update the display state
          } else {
            console.error("No insane universitys found.");
          }
        },
      });
    }
  }
}
// MapHandler Class
class MapHandler {
  constructor(mapId) {
    this.map = L.map(mapId);
    this.map.setView([51.505, -0.09], 5);
    this.userLocation = null;
    this.countryBorder = null; // Add this line to store the country's border
    this.userLocationMarker = null;
    this.routingControl = null; // Add this line
    this.currentAnimationIndex = 0; // Initialize to 0
    this.carMarker = null; // Add this line to store the car marker
    this.isAnimationRunning = false; // Add this line
    this.standardLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19 }
    ).addTo(this.map);
    this.satelliteLayer = L.tileLayer(
      "http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}",
      { maxZoom: 19 }
    );
    this.weatherAPI = new WeatherAPI();
    this.wikipediaAPI = new WikipediaAPI();
    this.geoNamesAPI = new GeoNamesAPI();
    this.locationCache = {};
    this.markers = [];
    this.isAnimationRunning = false; // To check if the animation is running
    this.isAnimationPaused = false; // To check if the animation is paused
    this.currentAnimationIndex = 0; // To keep track of the current animation index
    this.timeoutIds = []; // To store timeout IDs for clearing

    this.isMarkerPlacementActive = false;
    this.geoJsonLayer = null; // Add this line to store the GeoJSON layer
    this.init();
  }

  init() {
    this.locateUser();
    this.addLayerToggle();
    this.addLocationButton();
    this.addWeatherButton();
    this.addRouteButton(); // Add this line
    this.map.invalidateSize();
    this.geoNamesAPI.addCitiesAndAirportsButton(this.map);
    this.addLandmarkButton();
    this.addUniversityButton(); // Add this line to initialize the university button
    this.map.on("locationfound", this.onLocationFound.bind(this));
    this.clearMarkers();
    this.addClearMarkersButton();
    // Add click event to the map to create a marker
    this.map.on("click", (e) => {
      if (this.isAnimationRunning) {
        console.log("Animation is running, marker placement is disabled.");
        return; // Skip marker placement if animation is running
      }

      if (!this.isMarkerPlacementActive) return; // Skip if not active

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Create a marker and add it to the map
      const marker = L.marker([lat, lng]).addTo(this.map);

      // Store the marker in the array
      this.markers.push(marker);

      // Add click event to the marker
      marker.on("click", () => {
        // Fetch Wikipedia info when marker is clicked
        this.wikipediaAPI.fetchWikipediaForCentralLocation(this.map, lat, lng);
      });
    });
  }

  // Method to clear all markers
  clearMarkers() {
    this.isAnimationRunning = false; // Stop any ongoing animations
    this.isAnimationPaused = false;
    this.currentAnimationIndex = 0;

    this.markers.forEach((marker) => {
      this.map.removeLayer(marker);
    });
    this.markers = [];

    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

    console.log("Before removing carMarker:", this.carMarker); // Debugging line

    if (this.carMarker) {
      this.map.removeLayer(this.carMarker);
      this.carMarker = null;
    }

    console.log("After removing carMarker:", this.carMarker); // Debugging line

    // Force map to redraw
    this.map.invalidateSize();
  }

  // Method to create a route
  createRoute() {
    // Define waypoints here
    const waypoints = this.markers.map((marker) =>
      L.latLng(marker.getLatLng())
    );

    if (this.isAnimationRunning) {
      // Show a popup from the car icon
      if (this.carMarker) {
        const popup = L.popup()
          .setLatLng(this.carMarker.getLatLng())
          .setContent("Hold your horses, I'm on a route here!")
          .openOn(this.map);
      }
      return;
    }

    // Create a routing control and assign it to the class variable
    this.routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: true,
      addWaypoints: false,
      draggableWaypoints: false,
    }).addTo(this.map);

    // Create a car icon
    const carIcon = L.icon({
      iconUrl: "img/car-icon.png",
      iconSize: [30, 30],
    });

    // Create a marker with the car icon
    const carMarker = L.marker(waypoints[0], { icon: carIcon }).addTo(this.map);

    // Set this.carMarker to the newly created carMarker
    this.carMarker = carMarker;

    // Listen for routesfound event on the Routing Control
    this.routingControl.on("routesfound", (e) => {
      const coordinates = e.routes[0].coordinates;
      let i = 0;

      // Function to update car position
      const moveCar = () => {
        if (
          i < coordinates.length &&
          this.carMarker &&
          this.isAnimationRunning
        ) {
          this.carMarker.setLatLng(coordinates[i]);
          i++;
          setTimeout(moveCar, 5);
        }
      };

      // Start the animation
      this.isAnimationRunning = true; // Add this line
      moveCar();
    });

    // Function to update car position
    const moveCar = () => {
      if (
        this.currentAnimationIndex < coordinates.length &&
        this.carMarker &&
        this.isAnimationRunning
      ) {
        this.carMarker.setLatLng(coordinates[this.currentAnimationIndex]);
        this.currentAnimationIndex++; // Update the current index
        setTimeout(moveCar, 5); // Move every 1 second
      }
    };
  }

  // Function to fetch and display country border
  fetchAndDisplayCountryBorder(countryCode) {
    if (!countryCode) {
      console.error("Invalid country code");
      return;
    }

    // Load the GeoJSON file
    $.ajax({
      url: `./php/fetch_country_border.php?countryCode=${countryCode}`,
      type: "GET",
      dataType: "json",
      success: (result) => {
        console.log;
        if (result.status.code === 200) {
          // Extract the relevant data
          const coordinates = result.data.geometry.coordinates;

          // Create a GeoJSON feature
          const borderData = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: coordinates,
            },
          };

          // Remove existing border if any
          if (this.geoJsonLayer) {
            this.map.removeLayer(this.geoJsonLayer);
          }

          // Define the style for the border
          const borderStyle = {
            color: "#f43ff4",
            weight: 2,
            opacity: 0.3,
          };

          // Add the GeoJSON layer to the map
          this.geoJsonLayer = L.geoJSON(borderData, {
            style: borderStyle,
          }).addTo(this.map);
        } else {
          console.error("Server response was not ok");
        }
      },
      error: (jqXHR, textStatus, errorThrown) => {
        console.error(`Fetch error: ${textStatus}`);
        console.error("Error details:", errorThrown);
        console.error("Full response object:", jqXHR);
      },
    });
  }

  // Add this in your init() method to create the button
  addClearMarkersButton() {
    const clearMarkersButton = L.easyButton({
      states: [
        {
          stateName: "activate-markers",
          icon: "fa-map-marker",
          title: "Activate Markers",
          onClick: (btn, map) => {
            this.isMarkerPlacementActive = true;
            btn.state("deactivate-markers");
          },
        },
        {
          stateName: "deactivate-markers",
          icon: "fa-trash",
          title: "Deactivate Markers",
          onClick: (btn, map) => {
            this.isMarkerPlacementActive = false;
            this.clearMarkers();
            btn.state("activate-markers");
          },
        },
      ],
    }).addTo(this.map);
  }

  updateMap(latlng) {
    // Remove existing marker if any
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }

    // Update the map view
    this.map.setView(latlng, 10);

    // Add a new marker
    this.userLocationMarker = L.marker(latlng)
      .addTo(this.map)
      .bindPopup("Selected Location")
      .openPopup();
  }

  locateUser() {
    this.map.locate({ setView: true, maxZoom: 7 });
  }

  addLayerToggle() {
    L.easyButton({
      states: [
        {
          stateName: "show-satellite",
          icon: '<img src="earth.gif" width="20" height="20">',
          title: "Show Satellite Map",
          onClick: function (btn, map) {
            map.removeLayer(this.standardLayer);
            map.addLayer(this.satelliteLayer);
            btn.state("show-standard");
            fetchCitiesAndAirports;
          }.bind(this),
        },
        {
          stateName: "show-standard",
          icon: '<img src="map.gif" width="20" height="20">',
          title: "Show Standard Map",
          onClick: function (btn, map) {
            map.removeLayer(this.satelliteLayer);
            map.addLayer(this.standardLayer);
            btn.state("show-satellite");
          }.bind(this),
        },
      ],
    }).addTo(this.map);
  }

  addLocationButton() {
    L.easyButton({
      states: [
        {
          stateName: "show-location",
          icon: '<img src="located.gif" width="20" height="20">', // Use your location image
          title: "Show Current Location",
          onClick: (btn, map) => {
            if (this.userLocation) {
              this.map.flyTo(this.userLocation, 18);
            } else {
              console.log("User location is not available");
            }
          },
        },
      ],
    }).addTo(this.map);
  }

  addWeatherButton() {
    L.easyButton({
      states: [
        {
          stateName: "show-weather",
          icon: '<img src="weather.gif" width="20" height="20">',
          title: "Toggle Weather",
          onClick: (btn, map) => {
            this.weatherAPI.fetchWeatherForCentralLocation(
              this.map,
              this.locationCache
            );
          },
        },
      ],
    }).addTo(this.map);
  }

  addLandmarkButton() {
    const generateButtonConfig = (stateName, title, onClickHandler) => ({
      stateName,
      icon: `<img src="img/castle.gif" width="20" height="20">`,
      title: "Historical Landmarks",
      onClick: onClickHandler,
    });

    const landmarkButtonConfig = generateButtonConfig(
      "show-landmarks",
      "castle.png",
      async (btn, map) => {
        if (!this.geoNamesAPI.areLandmarksDisplayed) {
          await this.geoNamesAPI.fetchHistoricalLandmarks(
            map,
            this.wikipediaAPI
          );
        } else {
          this.geoNamesAPI.clearLandmarks(map);
        }
        this.geoNamesAPI.toggleLandmarkDisplay();
      }
    );

    L.easyButton({
      states: [landmarkButtonConfig],
    }).addTo(this.map);
  }

  addUniversityButton() {
    const generateButtonConfig = (
      stateName,
      iconSrc,
      title,
      onClickHandler
    ) => ({
      stateName,
      icon: `<img src="${iconSrc}" width="20" height="20">`,
      title,
      onClick: onClickHandler,
    });

    const universityButtonConfig = generateButtonConfig(
      "show-universities",
      "img/uni.gif",
      "Toggle Universities",
      async (btn, map) => {
        if (!this.geoNamesAPI.areUniversitiesDisplayed) {
          await this.geoNamesAPI.fetchInsaneUniversities(
            map,
            this.wikipediaAPI
          );
        } else {
          this.geoNamesAPI.clearUniversities(map);
        }
        this.geoNamesAPI.toggleUniversityDisplay();
      }
    );

    L.easyButton({
      states: [universityButtonConfig],
    }).addTo(this.map);
  }

  // Add this in your init() method to create the button
  addRouteButton() {
    const routeButton = L.easyButton({
      states: [
        {
          stateName: "create-route",
          icon: "fa-car",
          title: "Create Route",
          onClick: (btn, map) => {
            this.createRoute();
          },
        },
      ],
    }).addTo(this.map);
  }

  onLocationFound(e) {
    this.userLocation = e.latlng;
    this.userLocationMarker = L.marker(e.latlng)
      .addTo(this.map)
      .bindPopup("You are here")
      .openPopup();
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  const mapHandler = new MapHandler("mapid");

  // On page load, fetch continents and populate the dropdown
  $(document).ready(function () {
    $.ajax({
      url: "./php/fetch_continents.php",
      type: "GET",
      dataType: "json",
      success: function (data) {
        // Populate continents dropdown
        let options =
          '<option value="" disabled selected>Select Continent</option>';
        data.forEach(function (continent) {
          options += `<option value="${continent}">${continent}</option>`;
        });
        $("#continent-select").html(options);
      },
    });
  });

  // Add event listener to continents dropdown
  $("#continent-select").change(function () {
    const selectedContinent = $(this).val();
    // Fetch countries based on selected continent
    $.ajax({
      url: "./php/fetch_countries.php",
      type: "GET",
      data: { continent: selectedContinent },
      dataType: "json",
      success: function (data) {
        // Populate countries dropdown
        let options =
          '<option value="" disabled selected>Select Country</option>';
        data.forEach(function (country) {
          options += `<option value="${country.cca3}">${country.name.common}</option>`; // Use cca3 for alpha-3 code
        });
        $("#country-select").html(options);
        $("#country-select").prop("disabled", false);
      },
      error: function (error) {
        console.error("Error fetching country data: ", error);
      },
    });
  });

  // Define marker in a higher scope
  let marker;

  // Add event listener to "Search" button
  $("#search-button").click(function () {
    const selectedCountryAlpha3Code = $("#country-select").val(); // Get the selected country code directly
    if (selectedCountryAlpha3Code) {
      mapHandler.fetchAndDisplayCountryBorder(selectedCountryAlpha3Code); // <-- Change this line
    } else {
      console.log("No country selected");
    }

    // Fetch location based on selected country
    $.ajax({
      url: "php/fetch_location.php",
      type: "GET",
      data: { query: selectedCountryAlpha3Code },
      dataType: "json",
      success: function (receivedData) {
        console.log("Received Data: ", receivedData);

        const countryFeature = receivedData.features.find((feature) =>
          feature.place_type.includes("country")
        );

        if (!countryFeature) {
          console.error("No matching country found");
          return;
        }

        const [lng, lat] = countryFeature.geometry.coordinates;
        const wikidata = countryFeature.properties.wikidata;

        console.log("Latitude: ", lat);
        console.log("Longitude: ", lng);
        console.log("Wikidata ID: ", wikidata);

        // Center the map on the selected country's coordinates
        mapHandler.map.setView([lat, lng], 7); // Adjust the zoom level as needed

        // Create a marker and add it to the map
        const marker = L.marker([lat, lng]).addTo(mapHandler.map);

        // Add click event to the marker
        marker.on("click", function () {
          $.ajax({
            url: `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidata}&format=json&origin=*`,
            type: "GET",
            success: function (data) {
              console.log(data);
              const entity = data.entities[wikidata];
              const description = entity.descriptions.en
                ? entity.descriptions.en.value
                : "No description available";
              const population = entity.claims.P1082
                ? entity.claims.P1082[0].mainsnak.datavalue.value.amount
                : "Unknown";

              // Create a Leaflet popup with Wikidata information
              L.popup()
                .setLatLng([lat, lng])
                .setContent(
                  `<h3>${entity.labels.en.value}</h3>
                 <p>${description}</p>
                 <p>Population: ${population}</p>`
                )
                .openOn(mapHandler.map);
            },
            error: function (error) {
              console.error("Error fetching Wikidata: ", error);
            },
          });
        });
      },
      error: function (error) {
        console.error("Error fetching location data: ", error);
      },
    });
  });

  // current zoom
  mapHandler.map.on("zoomend", function () {
    const zoomLevel = mapHandler.map.getZoom();
    document.getElementById("zoom-display").innerHTML = `Zoom: ${zoomLevel}`;
  });
});
