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

  fetchWikipediaForCentralLocation(map, userAction = null) {
    console.log("fetchWikipediaForCentralLocation called");
    const center = map.getCenter();
    const lat = center.lat.toFixed(4);
    const lon = center.lng.toFixed(4);
    const zoomLevel = map.getZoom();

    let radius = 10000; // Default radius for city-level information

    this.makeAjaxCall(
      `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radius}&gslimit=1&format=json&origin=*`,
      "GET",
      "json",
      {},
      (result) => {
        if (
          result.query &&
          result.query.geosearch &&
          result.query.geosearch.length > 0
        ) {
          const pageId = result.query.geosearch[0].pageid;
          this.fetchWikipediaArticle(pageId);
        } else {
          console.error("No geosearch data found.");
        }
      },
      (error) => {
        console.error("Error fetching Wikipedia geosearch data: ", error);
      }
    );
  }

  fetchWikipediaArticle(pageId) {
    this.makeAjaxCall(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&pageids=${pageId}&origin=*`,
      "GET",
      "json",
      {},
      (result) => {
        if (result.query && result.query.pages && result.query.pages[pageId]) {
          const article = result.query.pages[pageId];
          const formattedText = `<h3>${article.title}</h3><p>${article.extract}</p>`;
          $("#wikipedia-title").html(article.title);
          $("#wikipedia-summary").html(formattedText);
          $("#wikipedia-modal").modal("show");
        } else {
          console.error("No Wikipedia article found.");
        }
      },
      (error) => {
        console.error("Error fetching Wikipedia article: ", error);
      }
    );
  }
}

// GeoNamesAPI Class
class GeoNamesAPI extends APIHandler {
  constructor() {
    super();
    this.markerClusterGroups = {};
    this.areAirportsDisplayed = false;
    this.airportMarkers = [];
    this.map = null; // Store the map reference
    this.areLandmarksDisplayed = false; // New state variable for landmarks
    this.landmarkMarkers = []; // New array to store landmark markers
  }

  fetchCitiesAndAirports(countryCode) {
    // Get the map bounds
    const bounds = this.map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    // Define bounding box
    const bbox = {
      north: northEast.lat,
      south: southWest.lat,
      east: northEast.lng,
      west: southWest.lng,
    };

    // If airports are already displayed, remove them
    if (this.areAirportsDisplayed) {
      this.airportMarkers.forEach((marker) => {
        this.map.removeLayer(marker);
      });
      this.airportMarkers = [];
      this.areAirportsDisplayed = false;
    } else {
      // Fetch and display airports
      $.ajax({
        url: "./php/fetch_geonames.php",
        type: "GET",
        dataType: "json",
        data: { featureCode: "AIRP", maxRows: 50, bbox: bbox },
        success: (data) => {
          // Remove any existing airport markers
          this.airportMarkers.forEach((marker) => {
            this.map.removeLayer(marker);
          });
          this.airportMarkers = [];

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
  // In GeoNamesAPI class
  addCitiesAndAirportsButton(map) {
    this.map = map;

    L.easyButton({
      states: [
        {
          stateName: "show-cities-and-airports",
          icon: '<img src="plane.gif" width="20" height="20">',
          title: "Toggle Cities and Airports",
          onClick: (btn) => {
            const center = this.map.getCenter();
            const lat = center.lat;
            const lng = center.lng;
            this.getCountryCodeFromOpenCage(lat, lng)
              .then((countryCode) => {
                this.fetchCitiesAndAirports(countryCode);
              })
              .catch((error) => {
                console.error("Failed to get country code: ", error);
              });
          },
        },
      ],
    }).addTo(map);
  }

  getCountryCodeFromOpenCage(lat, lng) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: "./php/fetch_ocairports.php",
        type: "GET",
        dataType: "json",
        data: { lat: lat, lng: lng },
        success: function (data) {
          // Check if data contains the countryCode field
          if (
            data &&
            data.results &&
            data.results.length > 0 &&
            data.results[0].components.country_code
          ) {
            resolve(data.results[0].components.country_code);
          } else {
            reject("Country code not found");
          }
        },
        error: function (error) {
          console.error("Error fetching country code: ", error);
          reject(error);
        },
      });
    });
  }

  // Inside the GeoNamesAPI class
  fetchHistoricalLandmarks(map) {
    // If landmarks are already displayed, remove them
    if (this.areLandmarksDisplayed) {
      this.landmarkMarkers.forEach((marker) => {
        map.removeLayer(marker);
      });
      this.landmarkMarkers = [];
      this.areLandmarksDisplayed = false;
    } else {
      const featureCode = "CH"; // Feature code for historical landmarks
      const iconUrl = "./castle.png"; // Icon URL for historical landmarks
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

      const center = map.getCenter();
      const lat = center.lat;
      const lng = center.lng;

      this.getCountryCodeFromOpenCage(lat, lng).then((countryCode) => {
        function zoomIn(lat, lng) {
          map.setView([lat, lng], 18);
        }

        $.ajax({
          url: "./php/fetch_geonames.php",
          type: "GET",
          dataType: "json",
          data: { featureCode: featureCode, maxRows: maxRows, bbox: bbox },
          success: (result) => {
            if (result.geonames && result.geonames.length > 0) {
              const landmarks = result.geonames;
              landmarks.forEach((landmark) => {
                const popupContent = document.createElement("div");
                const title = document.createElement("h3");
                title.textContent = landmark.name;
                const zoomButton = document.createElement("button");
                zoomButton.textContent = "Zoom In";
                zoomButton.addEventListener("click", () =>
                  zoomIn(landmark.lat, landmark.lng)
                );
                popupContent.appendChild(title);
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
      });
    }
  }
}

// MapHandler Class
class MapHandler {
  constructor(mapId) {
    this.map = L.map(mapId);
    this.map.setView([51.505, -0.09], 13);
    this.userLocation = null;
    this.userLocationMarker = null;
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
    this.geoNamesAPI = new GeoNamesAPI(); // Create an instance of GeoNamesAPI
    this.locationCache = {};
    this.init();
  }

  init() {
    this.locateUser();
    this.addLayerToggle();
    this.addLocationButton();
    this.addWeatherButton();
    this.geoNamesAPI.addCitiesAndAirportsButton(this.map); // Call the method through the instance
    this.addWikipediaButton();
    this.addLandmarkButton();
    this.map.on("locationfound", this.onLocationFound.bind(this));
  }

  locateUser() {
    this.map.locate({ setView: true, maxZoom: 15 });
  }

  addLayerToggle() {
    L.easyButton({
      states: [
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

  addWikipediaButton() {
    L.easyButton({
      states: [
        {
          stateName: "show-wikipedia",
          icon: '<img src="wiki.gif" width="20" height="20">', // Use your Wikipedia image
          title: "Toggle Wikipedia",
          onClick: (btn, map) => {
            this.wikipediaAPI.fetchWikipediaForCentralLocation(
              this.map,
              this.locationCache
            );
          },
        },
      ],
    }).addTo(this.map);
  }

  addLandmarkButton() {
    L.easyButton({
      states: [
        {
          stateName: "show-landmarks",
          icon: '<img src="castle.gif" width="20" height="20">', // Use your image
          title: "Toggle Historical Landmarks",
          onClick: (btn, map) => {
            if (!this.geoNamesAPI.areLandmarksDisplayed) {
              this.geoNamesAPI.fetchHistoricalLandmarks(map); // Pass the map object here
            } else {
              // Clear existing landmarks if displayed
              this.geoNamesAPI.landmarkMarkers.forEach((marker) => {
                map.removeLayer(marker);
              });
              this.geoNamesAPI.landmarkMarkers = [];
            }
            this.geoNamesAPI.areLandmarksDisplayed =
              !this.geoNamesAPI.areLandmarksDisplayed;
          },
        },
      ],
    }).addTo(this.map);
  }

  getCountryCode(lat, lng) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: "./php/fetch_geonames.php", // Replace with your PHP URL
        type: "GET",
        dataType: "json",
        data: { lat: lat, lng: lng },
        success: function (data) {
          if (data && data.countryCode) {
            resolve(data.countryCode);
          } else {
            reject("Country code not found");
          }
        },
        error: function (error) {
          console.error("Error fetching country code: ", error);
          reject(error);
        },
      });
    });
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

  // Existing DOM event listeners and other logic can now use mapHandler, weatherAPI, and wikipediaAPI
  const searchButton = document.getElementById("search-button");
  const locationSearch = document.getElementById("location-search");
  const airplaneIcon = L.divIcon({
    className: "custom-marker",
    html: '<i class="fas fa-plane"></i>', // Use the FontAwesome airplane icon here
    iconSize: [24, 24], // Adjust the size as needed
    iconAnchor: [12, 12], // Center the icon
  });

  searchButton.addEventListener("click", function () {
    const query = locationSearch.value.trim();
    if (query) {
      $.ajax({
        url: "./php/fetch_opencage.php",
        type: "GET",
        dataType: "json",
        data: { query: query },
        success: function (data) {
          if (data.results && data.results.length > 0) {
            const cityInfo = data.results[0];
            const latlng = [cityInfo.geometry.lat, cityInfo.geometry.lng];
            mapHandler.map.flyTo(latlng, 15);
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

  locationSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchButton.click();
    }
  });

  // current zoom
  mapHandler.map.on("zoomend", function () {
    const zoomLevel = mapHandler.map.getZoom();
    document.getElementById("zoom-display").innerHTML = `Zoom: ${zoomLevel}`;
  });
});
