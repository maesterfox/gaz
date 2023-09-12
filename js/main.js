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

class GeoNamesAPI extends APIHandler {
  constructor() {
    super();
    this.markerClusterGroups = {};
  }

  fetchCitiesAndAirports(countryCode, map) {
    const url = "./php/fetch_geonames_cities_and_airports.php";
    const data = { countryCode: countryCode };

    this.makeAjaxCall(
      url,
      "POST",
      "json",
      data,
      (result) => {
        // Process the result and add markers to the map
        // Create different marker cluster groups for cities and airports
      },
      (error) => {
        console.error("Error fetching cities and airports: ", error);
      }
    );
  }

  fetchHistoricalLandmarks(countryCode, map) {
    const featureCode = "CH"; // Feature code for historical sites
    const maxRows = 50; // Limit to 50 landmarks
    const url = "./php/fetch_geonames.php"; // Replace with your PHP URL
    const data = {
      countryCode: countryCode,
      featureCode: featureCode,
      maxRows: maxRows,
    };

    $.ajax({
      url: url,
      type: "POST",
      dataType: "json",
      data: data,
      success: (result) => {
        if (result.geonames && result.geonames.length > 0) {
          const landmarks = result.geonames;
          const landmarkMarkers = landmarks.map((landmark) => {
            return L.marker([landmark.lat, landmark.lng]).bindPopup(
              `<h3>${landmark.name}</h3>`
            );
          });

          if (!this.markerClusterGroups["landmarks"]) {
            this.markerClusterGroups["landmarks"] = L.markerClusterGroup();
          }

          this.markerClusterGroups["landmarks"].clearLayers();
          this.markerClusterGroups["landmarks"].addLayers(landmarkMarkers);
          this.markerClusterGroups["landmarks"].addTo(map);
        } else {
          console.error("No historical landmarks found.");
        }
      },
      error: (error) => {
        console.error("Error fetching historical landmarks: ", error);
      },
    });
  }
}

// MapHandler Class
class MapHandler {
  constructor(mapId) {
    this.map = L.map(mapId);
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
    this.locationCache = {};
    this.init();
  }

  init() {
    this.locateUser();
    this.addLayerToggle();
    this.addLocationButton();
    this.addWeatherButton();
    this.addCitiesAndAirportsButton();
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
          icon: "fa-map",
          title: "Show Standard Map",
          onClick: function (btn, map) {
            map.removeLayer(this.satelliteLayer);
            map.addLayer(this.standardLayer);
            btn.state("show-satellite");
          }.bind(this),
        },
        {
          stateName: "show-satellite",
          icon: "fa-globe",
          title: "Show Satellite Map",
          onClick: function (btn, map) {
            map.removeLayer(this.standardLayer);
            map.addLayer(this.satelliteLayer);
            btn.state("show-standard");
          }.bind(this),
        },
      ],
    }).addTo(this.map);
  }

  addLocationButton() {
    L.easyButton(
      "fa-crosshairs",
      function (btn, map) {
        if (this.userLocation) {
          this.map.flyTo(this.userLocation, 18);
        } else {
          console.log("User location is not available");
        }
      }.bind(this),
      "Show Current Location"
    ).addTo(this.map);
  }

  addWeatherButton() {
    L.easyButton(
      "fa-cloud",
      function (btn, map) {
        this.weatherAPI.fetchWeatherForCentralLocation(this.map);
      }.bind(this),
      "Toggle Weather"
    ).addTo(this.map);
  }

  addWikipediaButton() {
    L.easyButton(
      "fa-wikipedia-w",
      function (btn, map) {
        this.wikipediaAPI.fetchWikipediaForCentralLocation(
          this.map,
          this.locationCache
        );
      }.bind(this),
      "Toggle Wikipedia"
    ).addTo(this.map);
  }

  addCitiesAndAirportsButton() {
    L.easyButton({
      states: [
        {
          stateName: "show-cities-and-airports",
          icon: "fa-plane", // FontAwesome icon class for airports
          title: "Toggle Cities and Airports",
          onClick: function (btn, map) {
            const center = map.getCenter();
            const lat = center.lat;
            const lng = center.lng;
            this.getCountryCode(lat, lng).then((countryCode) => {
              this.geoNamesAPI.fetchCitiesAndAirports(countryCode, map);
            });
          }.bind(this),
        },
      ],
    }).addTo(this.map);
  }

  addLandmarkButton() {
    L.easyButton({
      states: [
        {
          stateName: "show-landmarks",
          icon: '<i class="fa fa-landmark"></i>', // For Landmarks
          title: "Toggle Historical Landmarks",
          onClick: function (btn, map) {
            const center = map.getCenter();
            const lat = center.lat;
            const lng = center.lng;
            this.getCountryCode(lat, lng).then((countryCode) => {
              this.geoNamesAPI.fetchHistoricalLandmarks(countryCode, map);
            });
          }.bind(this),
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
