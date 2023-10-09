// Preloader
$(window).on("load", function () {
  console.log("Window loaded"); // Debugging log
  if ($("#preloader").length) {
    console.log("Hide"); // Debugging log
    $("#preloader")
      .delay(1000)
      .fadeOut("slow", function () {
        $(this).remove();
      });
  }
});

// Constants for map URLs
const OPEN_STREET_MAP_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const GOOGLE_SATELLITE_URL =
  "http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}";

// Class to handle AJAX calls
class APIHandler {
  // Function to make an AJAX call and return a promise
  makeAjaxCall(url, type, dataType, data) {
    return new Promise((resolve, reject) => {
      // Perform the AJAX call
      $.ajax({
        url: url,
        type: type,
        dataType: dataType,
        data: data,
        // Resolve the promise on successful AJAX call
        success: (result) => {
          resolve(result);
        },
        // Reject the promise on error
        error: (error) => {
          reject(error);
        },
      });
    });
  }
}

// Class to handle weather-related API calls
class WeatherAPI extends APIHandler {
  // Function to fetch weather data for the central location of the map
  async fetchWeatherForCentralLocation(map) {
    try {
      const center = map.getCenter();
      const lat = center.lat;
      const lon = center.lng;

      // Make an AJAX call to fetch weather data
      const data = await this.makeAjaxCall(
        "./php/fetch_weather.php",
        "GET",
        "json",
        { lat: lat, lon: lon }
      );

      // Log the weather data received from the AJAX call
      console.log("Weather data:", data.weatherData);

      if (data.weatherData) {
        const weatherInfo = data.weatherData;
        const weatherModal = $("#weather-modal");
        const kelvinTemp = weatherInfo.main.temp;
        const celsiusTemp = (kelvinTemp - 273.15).toFixed(2);
        // Convert temperature from Kelvin to Celsius and Fahrenheit
        const fahrenheitTemp = ((celsiusTemp * 9) / 5 + 32).toFixed(2);
        const iconCode = weatherInfo.weather[0].icon; // Assuming the icon code is in the first element of the 'weather' array
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}.png`;

        // Update the weather modal with weather details
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
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }
}

// WikipediaAPI Class
class WikipediaAPI extends APIHandler {
  constructor() {
    super();
    this.locationCache = {};
  }

  async fetchWikipediaForCentralLocation(map, lat = null, lon = null) {
    try {
      console.log("fetchWikipediaForCentralLocation called");
      if (!lat || !lon) {
        const center = map.getCenter();
        lat = center.lat.toFixed(6);
        lon = center.lng.toFixed(6);
      }

      console.log("Sending lat:", lat, " lon:", lon);

      const result = await this.makeAjaxCall(
        "./php/fetch_wikipedia.php", // Your PHP file path
        "GET",
        "json",
        { lat: lat, lon: lon } // Pass parameters to PHP
      );

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
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }
}

// GeoNamesAPI Class
class GeoNamesAPI extends APIHandler {
  constructor() {
    super();
    this.locationCache = {};
    this.markerClusterGroups = {};
    this.map = null; // Store the map reference
    this.routeButton = null; // Add this line to store the route button
  }

  createPopup(content, lat, lng) {
    $("#infoModal .modal-body").html(content);
    $("#infoModal").modal("show");
  }

  addClickEventToMarker(marker, callback) {
    marker.on("click", callback);
  }
}

let userLocationMarker = null;

// MapHandler Class
class MapHandler {
  constructor(mapId) {
    this.map = L.map(mapId);
    this.myCircles = L.layerGroup().addTo(this.map); // Initialize myCircles layer group
    this.quakeMapper = false; // Initialize quakeMapper flag
    this.userLocation = null;
    this.countryBorder = null;
    this.userLocationMarker = null;
    this.currentCountryName = null;
    this.singleMarker = null; // Initialize to null
    this.routingControl = null; // Add this line
    this.currentAnimationIndex = 0; // Initialize to 0
    this.carMarker = null; // Add this line to store the car marker
    this.areMarkersActive = false; // Add this line to track if markers are active
    this.isAnimationRunning = false;
    this.pointdata = L.layerGroup(); // Initialize this as per your requirement
    this.linedata = L.layerGroup(); // Initialize this as per your requirement
    this.polygondata = L.layerGroup(); // Initialize this as per your requirement

    this.openStreetMap_HOT = L.tileLayer(
      "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
      }
    ); // Add this line
    this.thunderforestTransportDark = L.tileLayer(
      "https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey={apikey}",
      {
        apikey: "8d88d1ca689749cdaf61d2e8b86bfbec",
        maxZoom: 22,
      }
    );

    this.thunderforestSpinalMap = L.tileLayer(
      "https://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey={apikey}",
      {
        apikey: "8d88d1ca689749cdaf61d2e8b86bfbec",
        maxZoom: 22,
      }
    );

    this.openTopoMap = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 17,
      }
    );
    this.standardLayer = L.tileLayer(OPEN_STREET_MAP_URL, {
      maxZoom: 19,
    }).addTo(this.map);
    this.satelliteLayer = L.tileLayer(GOOGLE_SATELLITE_URL, { maxZoom: 19 });
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
    console.log("Init function called");

    this.initializeMap();
    this.initializeLayers();
    this.initializeButtons();
    this.initializeEventHandlers();
    this.fetchAndSetUserLocation();
  }

  initializeMap() {
    this.map.invalidateSize();
  }

  initializeButtons() {
    this.initializeLayers();
    this.addWeatherButton();
    this.addClearMarkersButton();
    this.routeButton = this.addRouteButton(); // Store the route button
    this.routeButton.disable(); // Disable the route button initially
    this.addEarthquakeDataButton();
    this.addNewsButton(); // Initialize the news button
  }

  initializeEventHandlers() {
    this.map.on("locationfound", this.onLocationFound.bind(this));
    this.map.on("click", this.handleMapClick.bind(this));
    this.updateRouteButtonState();
    this.map.on("baselayerchange", this.updateCarIcon.bind(this));
  }

  updateRouteButtonState() {
    if (this.markers.length >= 2) {
      this.routeButton.enable();
    } else {
      this.routeButton.disable();
    }
  }

  updateCarIcon() {
    if (this.carMarker) {
      if (this.map.hasLayer(this.thunderforestSpinalMap)) {
        this.carMarker.setIcon(carIconSpinal);
      } else {
        this.carMarker.setIcon(carIconStandard);
      }
    }
  }

  onLocationFound(e) {
    this.userLocation = e.latlng;

    // Remove existing user location marker if it exists
    if (this.singleMarker) {
      this.map.removeLayer(this.singleMarker);
    }

    // Initialize or update the singleMarker to the user's location
    this.singleMarker = L.marker(this.userLocation).addTo(this.map);

    // Optionally, you can also set a popup
    this.singleMarker.bindPopup("You are here").openPopup();

    // Update the layer control to reflect the new or updated marker
    this.initializeOrUpdateLayerControl();
  }

  handleMapClick(e) {
    if (this.isAnimationRunning) {
      console.log("Animation is running, marker placement is disabled.");
      return;
    }

    if (!this.isMarkerPlacementActive) return;

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const marker = L.marker([lat, lng]).addTo(this.map);
    this.markers.push(marker);
    marker.on("click", () => {
      this.wikipediaAPI.fetchWikipediaForCentralLocation(this.map, lat, lng);
    });
    this.updateRouteButtonState(); // Add this line
  }

  // Method to clear all markers
  clearMarkers() {
    this.isAnimationRunning = false; // Stop any ongoing animations
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
    this.updateRouteButtonState(); // Add this line
  }

  // Method to create a route
  createRoute() {
    // Define waypoints here
    const waypoints = this.markers.map((marker) =>
      L.latLng(marker.getLatLng())
    );
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

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
    const carIconStandard = L.icon({
      iconUrl: "img/car-icon.png",
      iconSize: [30, 30],
    });

    const carIconSpinal = L.icon({
      iconUrl: "img/ghostrider.gif",
      iconSize: [100, 100],
    });

    // Create a marker with the car icon
    const initialCarIcon = this.map.hasLayer(this.thunderforestSpinalMap)
      ? carIconSpinal
      : carIconStandard;
    const carMarker = L.marker(waypoints[0], { icon: initialCarIcon }).addTo(
      this.map
    );

    // Set this.carMarker to the newly created carMarker
    this.carMarker = carMarker;

    // Listen for routesfound event on the Routing Control
    this.routingControl.on("routesfound", (e) => {
      console.log("routesfound event triggered"); // Debugging line
      const coordinates = e.routes[0].coordinates;
      console.log("Coordinates:", coordinates); // Debugging line

      // Function to update car position
      const moveCar = () => {
        console.log("Inside moveCar function"); // Debugging line
        if (
          this.currentAnimationIndex < coordinates.length &&
          this.carMarker &&
          this.isAnimationRunning
        ) {
          console.log("Animating car"); // Debugging line
          this.carMarker.setLatLng(coordinates[this.currentAnimationIndex]);
          this.currentAnimationIndex++; // Update the current index
          setTimeout(moveCar, 5);
        }
      };

      // Start the animation
      this.isAnimationRunning = true; // Add this line
      console.log("Starting animation"); // Debugging line
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

  initializeLayers() {
    // CartoDB DarkMatter Layer
    this.CartoDB_DarkMatter = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    );

    // Google Streets Layer
    this.googleStreets = L.tileLayer(
      "http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }
    );

    // Google Satellite Layer
    this.googleSat = L.tileLayer(
      "http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }
    );

    // Stamen Watercolor Layer
    this.Stamen_Watercolor = L.tileLayer(
      "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}",
      {
        subdomains: "abcd",
        minZoom: 1,
        maxZoom: 16,
        ext: "jpg",
      }
    );

    // Base Layers for Layer Control
    this.baseLayers = {
      Satellite: this.googleSat,
      "Google Streets": this.googleStreets,
      Watercolor: this.Stamen_Watercolor,
      "Dark Matter": this.CartoDB_DarkMatter,
      "Standard Map": this.standardLayer,
      "Hot Map": this.openStreetMap_HOT,
      "Transport Dark Map": this.thunderforestTransportDark,
      "Spinal Map": this.thunderforestSpinalMap,
      "Topo Map": this.openTopoMap,
    };
    this.initializeOrUpdateLayerControl();
  }

  initializeOrUpdateLayerControl() {
    // Remove the existing layer control if it exists
    if (this.layerControl) {
      this.layerControl.remove();
    }

    // Update the overlays
    this.overlays = {
      "User Location": this.singleMarker || new L.LayerGroup(), // Use an empty LayerGroup if singleMarker is null
    };

    // Add a new layer control
    this.layerControl = L.control
      .layers(this.baseLayers, this.overlays)
      .addTo(this.map);
  }

  fetchAndSetUserLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.map.setView([latitude, longitude], 6);

        // Create and set the singleMarker
        this.singleMarker = L.marker([latitude, longitude]).addTo(this.map);
        this.singleMarker.bindPopup("You are here").openPopup();

        // Update the layer control to reflect the new or updated marker
        this.initializeOrUpdateLayerControl();

        // Fetch the country code based on the user's latitude and longitude
        $.ajax({
          url: `php/fetch_geonames.php?lat=${latitude}&lng=${longitude}`,
          type: "GET",
          dataType: "json",
          success: (data) => {
            console.log(data);
            const { countryCode, countryName } = data;
            if (countryName) {
              // Use the countryName to fetch and display the border
              this.fetchAndDisplayCountryBorder(null, countryName);
            }
          },
          error: (error) => {
            console.error("Could not fetch country code:", error);
          },
        });
      },
      (error) => {
        console.error("Could not fetch user location:", error);
      }
    );
  }

  // Function to fetch and display country border
  fetchAndDisplayCountryBorder(countryCode, countryName) {
    console.log(countryCode, countryName);

    // Prioritize using countryName if available
    const countryIdentifier = countryName || countryCode;

    if (!countryIdentifier) {
      console.error("Invalid country identifier");
      return;
    }

    // Load the GeoJSON file
    $.ajax({
      url: `./php/fetch_country_border.php`, // Adjust the URL as needed
      type: "GET",
      data: { countryCode: countryCode, countryName: countryName },
      dataType: "json",
      success: (result) => {
        console.log(countryIdentifier);
        console.log("Server response:", result);

        // Check if the result has the expected structure
        if (result && result.properties && result.geometry) {
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

          // Create a GeoJSON feature from the result
          const geoJsonFeature = {
            type: "Feature",
            properties: result.properties,
            geometry: result.geometry,
          };

          // Add the GeoJSON layer to the map
          this.geoJsonLayer = L.geoJSON(geoJsonFeature, {
            style: borderStyle,
          }).addTo(this.map);
        } else {
          console.error("Invalid GeoJSON data format");
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

  plotEarthquakeData(result) {
    if (result && result.features) {
      if (!this.quakeMapper) {
        for (let i = 0; i < result.features.length; i++) {
          // Your existing code for plotting earthquake data
        }
        this.quakeMapper = true;
      } else {
        this.myCircles.eachLayer((layer) => {
          this.myCircles.removeLayer(layer);
        });
        this.quakeMapper = false;
      }
    } else {
      console.error("Invalid or incomplete data", result);
    }
  }

  async fetchEarthquakeData() {
    try {
      const response = await fetch("php/fetch_earthquakes.php");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Fetched Data:", data);
      return data.earthquakeData;
    } catch (error) {
      console.error("Error fetching earthquake data:", error);
      return null;
    }
  }

  addNewsButton() {
    L.easyButton({
      states: [
        {
          stateName: "fetch-news",
          icon: "fa-newspaper",
          title: "Fetch News",
          onClick: (btn, map) => {
            // Assuming this.currentCountryName holds the country name
            $.ajax({
              url: `php/fetch_news.php?newsCountry=${this.currentCountryName}`,
              type: "GET",
              dataType: "json",
              data: {
                lr: "en-US", // Replace with the correct language region code
              },
              success: (result) => {
                console.log(result);

                // Check if the result contains the data you need
                if (result && Array.isArray(result.items)) {
                  let modalContent = "";

                  // Iterate through the news articles and build the modal content
                  result.items.forEach((article) => {
                    modalContent += `
                      <div class="news-article">
                        <h5>${article.title}</h5>
                        <p>${article.snippet}</p>
                        <a href="${article.newsUrl}" target="_blank">Read more</a>
                      </div>
                    `;
                  });

                  // Populate the modal with the news articles
                  document.getElementById("news-data").innerHTML = modalContent;

                  // Show the modal
                  $("#news-info-modal").modal("show");
                } else {
                  console.error("No news articles found.");
                }
              },
              error: (jqXHR, textStatus, errorThrown) => {
                console.log(textStatus, errorThrown);
              },
            });
          },
        },
      ],
    }).addTo(this.map);
  }

  addEarthquakeDataButton() {
    L.easyButton({
      states: [
        {
          stateName: "fetch-earthquake-data",
          icon: "fa-globe",
          title: "Fetch Earthquake Data",
          onClick: (btn, map) => {
            if (!this.quakeMapper) {
              map.setZoom(3);
              $.ajax({
                url: "php/fetch_earthquakes.php",
                type: "GET",
                dataType: "json",
                success: (result) => {
                  console.log(result); // Debugging line
                  if (result.earthquakeData && result.earthquakeData.features) {
                    for (
                      let i = 0;
                      i < result.earthquakeData.features.length;
                      i++
                    ) {
                      const quakePos =
                        result.earthquakeData.features[i].geometry.coordinates;
                      const mag =
                        result.earthquakeData.features[i].properties.mag *
                        32 *
                        50;
                      const locDate = new Date(
                        result.earthquakeData.features[i].properties.time
                      )
                        .toISOString()
                        .slice(0, 19)
                        .replace("T", " / ");

                      L.circle([quakePos[1], quakePos[0]], {
                        color: "red",
                        fillColor: "white",
                        fillOpacity: 0.8,
                        radius: mag,
                        stroke: true,
                        weight: 5,
                      }).addTo(this.myCircles).bindPopup(`
  <div class="earthquake-popup">
    <h5 class="magnitude">Magnitude: ${result.earthquakeData.features[i].properties.mag} points</h5>
    <p class="place"><strong>Place: </strong>${result.earthquakeData.features[i].properties.place}</p>
    <p class="type"><strong>Type: </strong>${result.earthquakeData.features[i].properties.type}</p>
    <p class="unix-time"><strong>Unix Time: </strong>${result.earthquakeData.features[i].properties.time}</p>
    <p class="local-date-time"><strong>Local Date / Time: </strong>${locDate}</p>
  </div>
`);
                    }
                    this.quakeMapper = true;
                  } else {
                    console.error(
                      "No earthquakeData or features found in the result."
                    );
                  }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                  console.log(textStatus, errorThrown);
                },
              });
            } else {
              this.myCircles.eachLayer((layer) => {
                this.myCircles.removeLayer(layer);
              });
              this.quakeMapper = false;
            }
          },
        },
      ],
    }).addTo(this.map);
  }

  addRouteButton() {
    const routeButton = L.easyButton({
      states: [
        {
          stateName: "create-route",
          icon: "fa-car",
          title: "Create Route",
          onClick: () => {
            console.log("Route button clicked"); // Debugging line
            console.log(this); // Debugging line to check the context of 'this'

            if (this.markers.length >= 2) {
              // Removed this.areMarkersActive
              console.log("Creating route"); // Debugging line
              this.createRoute();
            } else {
              console.log("Cannot create route"); // Debugging line
            }
          },
        },
      ],
    }).addTo(this.map);
    return routeButton;
  }
}

// Declare wikidata at a broader scope
let wikidata;
// Declare currentCountryInfo at a broader scope
let currentCountryInfo = {};

(function () {
  // Initialize
  document.addEventListener("DOMContentLoaded", function () {
    const mapHandler = new MapHandler("mapid");

    // Step 2: On page load, fetch countries and populate the dropdown
    $(document).ready(function () {
      $.ajax({
        url: "./php/fetch_countries.php",
        type: "GET",
        dataType: "json",
        success: function (data) {
          data.sort((a, b) => a.name.common.localeCompare(b.name.common));
          let options =
            '<option value="" disabled selected>Select Country</option>';
          data.forEach(function (country) {
            options += `<option value="${country.cca3}">${country.name.common}</option>`;
          });
          $("#country-select").html(options);
          $("#country-select").prop("disabled", false);
        },

        error: function (error) {
          console.error("Error fetching country data: ", error);
        },
      });
    });

    // Add event listener to "Search" button
    $("#search-button").click(function () {
      const selectedCountryAlpha3Code = $("#country-select").val();
      const selectedCountryName = $("#country-select")
        .find("option:selected")
        .text();

      // Update the current country name in mapHandler
      mapHandler.currentCountryName = selectedCountryName;

      if (selectedCountryAlpha3Code) {
        mapHandler.fetchAndDisplayCountryBorder(selectedCountryAlpha3Code);
      } else {
        console.log("No country selected");
      }

      $.ajax({
        url: "php/fetch_location.php",
        type: "GET",
        data: { query: selectedCountryAlpha3Code, exact: true },
        dataType: "json",
        success: function (receivedData) {
          const countryFeature = receivedData.features.find((feature) =>
            feature.place_type.includes("country")
          );
          if (!countryFeature) {
            console.error("No matching country found");
            return;
          }
          infoButton.enable();

          const [lng, lat] = countryFeature.geometry.coordinates;
          wikidata = countryFeature.properties.wikidata;
          mapHandler.map.setView([lat, lng], 5);

          $.ajax({
            url: `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidata}&format=json&origin=*`,
            type: "GET",
            success: function (data) {
              const entity = data.entities[wikidata];

              // Check and fetch description
              const description =
                entity.descriptions && entity.descriptions.en
                  ? entity.descriptions.en.value
                  : "No description available";

              // Check and fetch population
              const population =
                entity.claims &&
                entity.claims.P1082 &&
                entity.claims.P1082[0].mainsnak.datavalue
                  ? entity.claims.P1082[0].mainsnak.datavalue.value.amount
                  : "Unknown";

              // Check and fetch flag
              let flag = "No flag available";
              if (
                entity.claims &&
                entity.claims.P41 &&
                entity.claims.P41[0].mainsnak.datavalue
              ) {
                const flagFileName =
                  entity.claims.P41[0].mainsnak.datavalue.value;
                flag = `https://commons.wikimedia.org/wiki/Special:FilePath/${flagFileName}?width=300`; // Adjust width as needed
              }

              // Populate the Country Info modal with Wikidata information
              $("#countryInfoModalLabel").text(entity.labels.en.value);

              $("#country-title").html(`<h3>${entity.labels.en.value}</h3>`);

              $("#country-description").html(
                `<p>Description: ${description}</p>`
              );

              $("#country-population").html(`<p>Population: ${population}</p>`);

              $("#country-flag").html(
                `<img src="${flag}" alt="Flag of ${entity.labels.en.value}" width="100">`
              );

              // Update currentCountryInfo
              currentCountryInfo = {
                title: entity.labels.en.value,
                description: description,
                population: population,
                flag: flag,
              };
            },
          });
        },
        error: function (error) {
          console.error("Error fetching location data: ", error);
        },
      });
    });

    // Initialize easyButton
    let infoButton = L.easyButton({
      id: "toggle-info-button",
      position: "topleft",
      type: "replace",
      leafletClasses: true,
      states: [
        {
          stateName: "show-info",
          onClick: function (button, map) {
            // Populate the modal using currentCountryInfo
            $("#countryInfoModalLabel").text(currentCountryInfo.title);
            $("#country-title").html(`<h3>${currentCountryInfo.title}</h3>`);
            $("#country-description").html(
              `<p>Description: ${currentCountryInfo.description}</p>`
            );
            $("#country-population").html(
              `<p>Population: ${currentCountryInfo.population}</p>`
            );
            $("#country-flag").html(
              `<img src="${currentCountryInfo.flag}" alt="Flag of ${currentCountryInfo.title}" width="100">`
            );
            $("#country-info-modal").modal("show");
          },
          title: "Show country info",
          icon: "fa-info",
        },
      ],
    });
    infoButton.addTo(mapHandler.map);
    infoButton.disable(); // Disable the button initially

    // Bootstrap modal events to toggle the easyButton state
    $("#wikipedia-modal").on("shown.bs.modal", function () {
      infoButton.state("hide-info");
    });

    $("#wikipedia-modal").on("hidden.bs.modal", function () {
      infoButton.state("show-info");
    });

    $("#wikipedia-modal").on("hidden.bs.modal", function () {
      infoButton.state("show-info");
    });

    // current zoom
    mapHandler.map.on("zoomend", function () {
      const zoomLevel = mapHandler.map.getZoom();
      document.getElementById("zoom-display").innerHTML = `Zoom: ${zoomLevel}`;
    });
  });
})();
