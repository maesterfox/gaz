// Loader
$(window).on("load", function () {
  if ($("#preloader").length) {
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

/**
 * APIHandler Class
 *
 * This class centralizes all AJAX operations for the application.
 * It provides methods to execute generic AJAX requests, handle responses,
 * and manage errors. Designed to be a reusable component for various parts of the application.
 */
class APIHandler {
  // Method to execute a generic AJAX call and return a promise
  makeAjaxCall(url, type, dataType, data) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        type: type,
        dataType: dataType,
        data: data,
        success: resolve,
        error: function (jqXHR, textStatus, errorThrown) {
          reject(
            new Error(
              `Failed with status: ${textStatus}, error message: ${errorThrown}`
            )
            /* added the error callback that takes three parameters: jqXHR, textStatus, and errorThrown. These parameters provide details about the failed request. */
          );
        },
      });
    });
  }

  /**
   * makeParameterizedAjaxCall Method
   *
   * Executes an AJAX request with query parameters.
   *
   * @param {String} url - The base URL for the AJAX request.
   * @param {Object} params - An object containing the query parameters as key-value pairs.
   *
   * @returns {Promise} - A Promise that resolves with the AJAX response data if successful,
   *                      or rejects with an error message if the AJAX call fails.
   */
  makeParameterizedAjaxCall(url, params) {
    return new Promise((resolve, reject) => {
      // Construct the full URL with parameters
      const fullUrl = `${url}?${$.param(params)}`;
      // Execute the AJAX request
      $.ajax({
        url: fullUrl,
        type: "GET",
        dataType: "json",
        success: resolve,
        error: reject,
      });
    });
  }

  // Generic easyButton function
  addButton(map, stateName, icon, title, onClickHandler) {
    L.easyButton({
      states: [
        {
          stateName: stateName,
          icon: icon,
          title: title,
          onClick: (btn, mapInstance) => {
            onClickHandler(btn, mapInstance);
          },
        },
      ],
    }).addTo(map);
  }
}

// Class to handle weather-related API calls
class WeatherAPI extends APIHandler {
  constructor() {
    super();
    /**
     * Data Cache Object
     * This object is used to cache weather data for specific geographical coordinates.
     */
    this.dataCache = {};
  }

  async fetchWeatherForCentralLocation(map) {
    const center = map.getCenter();
    const lat = center.lat;
    const lon = center.lng;
    const cacheKey = `${lat.toFixed(6)}:${lon.toFixed(6)}`; // Create a unique cache key

    // Check cache
    if (this.dataCache[cacheKey]) {
      return this.dataCache[cacheKey]; // Return cached data if available
    }

    // Make an API call if data is not in cache
    const data = await this.makeAjaxCall(
      "./php/fetch_weather.php",
      "GET",
      "json",
      { lat: lat, lon: lon }
    );

    this.dataCache[cacheKey] = data; // Store data in cache

    // Log the weather data received from the AJAX call
    // console.log("Weather data:", data.weatherData);

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
  }
  catch(error) {
    console.error("Error fetching data: ", error);
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
      // console.log("fetchWikipediaForCentralLocation called");

      // If latitude and longitude are not provided, default to the coordinates of the map's center
      if (!lat || !lon) {
        const center = map.getCenter();
        lat = center.lat.toFixed(6);
        lon = center.lng.toFixed(6);
      }

      // console.log("Sending lat:", lat, " lon:", lon);

      // Fetch basic Geonames information
      const result = await this.makeAjaxCall(
        "./php/fetch_wikipedia.php",
        "GET",
        "json",
        { lat: lat, lon: lon }
      );
      // Check if 'result.placeInfo.geonames' exists and is not empty
      if (
        result.placeInfo &&
        result.placeInfo.geonames &&
        result.placeInfo.geonames.length > 0
      ) {
        const countryName = result.placeInfo.geonames[0].countryName;
        console.log("Country Name: ", countryName);

        // Fetch historical data from Wikipedia via PHP
        const historyResult = await this.makeAjaxCall(
          "./php/fetch_country_history.php",
          "GET",
          "json",
          { countryName: countryName }
        );
        console.log("History Result:", historyResult);

        // Assume the page ID is the first key in the 'pages' object
        const pageId = Object.keys(historyResult.query.pages)[0];
        const countryHistory = historyResult.query.pages[pageId].extract;

        // Display the fetched history in the new modal
        $("#country-history").html(countryHistory);
        $("#wikipedia-history-modal").modal("show");
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
  }

  createPopup(content, lat, lng) {
    $("#infoModal .modal-body").html(content);
    $("#infoModal").modal("show");
  }

  addClickEventToMarker(marker, callback) {
    marker.on("click", callback);
  }
}

// MapHandler Class
class MapHandler extends APIHandler {
  constructor(mapId) {
    super(); // Call super before using 'this'
    this.map = L.map(mapId); // Now it's okay to use 'this'
    this.dataCache = {};
    this.currentCountryName = null;
    this.countryCode = null; // Define countryCode as a class property
    this.border = null; // Initialize to null
    this.singleMarker = null; // Initialize to null
    this.standardLayer = L.tileLayer(OPEN_STREET_MAP_URL, {
      maxZoom: 19,
    }).addTo(this.map);
    this.satelliteLayer = L.tileLayer(GOOGLE_SATELLITE_URL, { maxZoom: 19 });
    this.layerGroups = {
      Standard: this.standardLayer,
      Satellite: this.satelliteLayer,
    };
    this.airports = L.markerClusterGroup({
      polygonOptions: {
        fillColor: "#fff",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5,
      },
    }).addTo(this.map);

    this.trains = L.markerClusterGroup({
      polygonOptions: {
        fillColor: "#fff",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5,
      },
    }).addTo(this.map);

    this.universities = L.markerClusterGroup({
      polygonOptions: {
        fillColor: "#fff",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5,
      },
    }).addTo(this.map);

    this.castles = L.markerClusterGroup({
      polygonOptions: {
        fillColor: "#fff",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5,
      },
    }).addTo(this.map);

    this.weatherAPI = new WeatherAPI();
    this.locationCache = {};
    this.geoJsonLayer = null; // Add this line to store the GeoJSON layer
    this.init();
  }

  async init() {
    this.initializeMap();
    this.initializeButtons();
    this.fetchAndSetUserLocation();
    this.initializeLayerControl();
    this.initMarkerIcons(); // Add this line
    this.fetchAirports(); // Add this line
    this.fetchTrains(); // Add this line
    this.fetchUniversities(); // Fetch for GB initially
    this.fetchCastles(); // Fetch for GB initially
  }

  initializeLayerControl() {
    // Define a base map (if needed)
    const baseMaps = {
      Standard: this.standardLayer,
      Satellite: this.satelliteLayer,
    };

    // Create a feature group for airports and trains
    const airportFeatureGroup = L.featureGroup([this.airports]);
    const trainFeatureGroup = L.featureGroup([this.trains]);
    const universityGroup = L.featureGroup([this.universities]);
    const castleGroup = L.featureGroup([this.castles]);

    // Add the feature groups to the map, which checks the corresponding checkboxes
    airportFeatureGroup.addTo(this.map);
    trainFeatureGroup.addTo(this.map);
    universityGroup.addTo(this.map);
    castleGroup.addTo(this.map);

    // Define overlays including airports and trains with checkboxes
    const overlays = {
      Airports: airportFeatureGroup,
      "Train Stations": trainFeatureGroup,
      Universities: universityGroup,
      Castles: castleGroup,
    };

    // Add the Layer Control with checkboxes
    L.control
      .layers(baseMaps, overlays)
      .addTo(this.map)
      .setPosition("topright");
  }

  initMarkerIcons() {
    this.airportIcon = L.divIcon({
      className: "custom-marker-icon", // Define a custom CSS class for styling
      html: '<i class="fa fa-plane" style="color: blue;"></i>', // Font Awesome plane icon
      iconSize: [48, 48], // Adjust the size as needed
    });

    this.trainIcon = L.divIcon({
      className: "custom-marker-icon", // Define a custom CSS class for styling
      html: '<i class="fa fa-train" style="color: red;"></i>', // Font Awesome city icon
      iconSize: [48, 48], // Adjust the size as needed
    });

    this.universityIcon = L.divIcon({
      className: "custom-marker-icon",
      html: '<i class="fa fa-graduation-cap" style="color: green;"></i>',
      iconSize: [48, 48],
    });

    this.castleIcon = L.divIcon({
      className: "custom-marker-icon",
      html: '<i class="fa fa-chess-rook" style="color: purple;"></i>',
      iconSize: [48, 48],
    });
  }

  initializeMap() {
    this.map.invalidateSize();
  }

  async fetchAirports(isoCode) {
    $.ajax({
      url: "./php/fetch_airports.php",
      type: "POST",
      dataType: "json",
      data: {
        iso: isoCode,
      },
      success: (result) => {
        this.airports.clearLayers(); // Clear existing markers
        if (result.status.code == 200) {
          result.data.forEach((item) => {
            L.marker([item.lat, item.lng], { icon: this.airportIcon })
              .bindTooltip(item.name, { direction: "top", sticky: true })
              .addTo(this.airports);
          });
        }
      },
      error: (jqXHR, textStatus, errorThrown) => {},
    });
  }

  async fetchTrains(isoCode) {
    $.ajax({
      url: "./php/fetch_trains.php",
      type: "POST",
      dataType: "json",
      data: {
        iso: isoCode,
      },
      success: (result) => {
        this.trains.clearLayers(); // Clear existing markers
        if (result.status.code == 200) {
          result.data.forEach((item) => {
            L.marker([item.lat, item.lng], { icon: this.trainIcon })
              .bindTooltip(item.name, { direction: "top", sticky: true })
              .addTo(this.trains);
          });
        }
      },
      error: (jqXHR, textStatus, errorThrown) => {},
    });
  }

  async fetchUniversities(isoCode) {
    $.ajax({
      url: "./php/fetch_universities.php",
      type: "POST",
      dataType: "json",
      data: {
        iso: isoCode,
      },
      success: (result) => {
        console.log("Success result:", result);
        this.universities.clearLayers(); // Clear existing markers
        if (result.status.code == 200) {
          result.data.forEach((item) => {
            L.marker([item.lat, item.lng], { icon: this.universityIcon })
              .bindTooltip(item.name, { direction: "top", sticky: true })
              .addTo(this.universities);
          });
        }
      },
    });
  }

  async fetchCastles(isoCode) {
    $.ajax({
      url: "./php/fetch_castles.php",
      type: "POST",
      dataType: "json",
      data: {
        iso: isoCode,
      },
      success: (result) => {
        this.castles.clearLayers(); // Clear existing markers
        if (result.status.code == 200) {
          result.data.forEach((item) => {
            L.marker([item.lat, item.lng]) // You can add icon here
              .bindTooltip(item.name, { direction: "top", sticky: true })
              .addTo(this.castles);
          });
        }
      },
      error: (jqXHR, textStatus, errorThrown) => {},
    });
  }

  initializeButtons() {
    // User Location Button
    this.addButton(
      this.map,
      "get-user-location",
      "fa-location-arrow",
      "Find Me",
      (btn, map) => {
        this.fetchAndSetUserLocation();

        // Update the country information modal
        // This assumes that `currentCountryInfo` is updated inside `fetchAndSetUserLocation()`
        if (currentCountryInfo.title) {
          // Populate the modal using currentCountryInfo
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

          // Add these lines to populate the capital and currency
          $("#country-capital").html(
            `<p>Capital: ${currentCountryInfo.capital}</p>`
          );
          $("#country-currency").html(
            `<p>Currency: ${currentCountryInfo.currency}</p>`
          );
        }
      }
    );

    // Wikipedia Button with Font Awesome icon
    this.addButton(
      this.map,
      "fetch-wikipedia", // You missed this argument in your example
      "fa-wikipedia-w", // No HTML tags, just the class name
      "Fetch Wikipedia Info",
      (btn, map) => {
        const wikipediaAPI = new WikipediaAPI();
        wikipediaAPI.fetchWikipediaForCentralLocation(map);
      }
    );

    this.addNewsButton(); // Initialize the news button

    // Weather Button with Font Awesome icon
    this.addButton(
      this.map,
      "show-weather",
      '<i class="fas fa-cloud-sun"></i>', // HTML i element with Font Awesome class
      "Toggle Weather",
      (btn, map) => {
        this.weatherAPI.fetchWeatherForCentralLocation(
          this.map,
          this.locationCache
        );
      }
    );
  }

  // Central location function

  async fetchCountryDataForCentralLocation(lat, lon) {
    const cacheKey = `${lat},${lon}`;

    // Check if data is in cache first
    if (this.dataCache[cacheKey]) {
      return this.dataCache[cacheKey];
    }

    try {
      const geoResult = await $.ajax({
        url: `./php/fetch_geonames.php?lat=${lat}&lng=${lon}`,
        type: "GET",
        dataType: "json",
      });

      console.log("Received geoResult:", geoResult);

      if (!geoResult || !geoResult.countryCode) {
        throw new Error("Invalid geoResult");
      }

      this.countryCode = geoResult.countryCode;

      // Store the result in cache
      this.dataCache[cacheKey] = geoResult;

      return geoResult;
    } catch (error) {
      console.error("Error fetching country data:", error);
      throw error;
    }
  }

  fetchAndSetUserLocation() {
    const self = this;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        self.map.setView([latitude, longitude], 5);

        // Fetch the country data based on latitude and longitude
        const geoResult = await this.fetchCountryDataForCentralLocation(
          latitude,
          longitude
        );
        const countryCode = geoResult.countryCode;

        // Fetch and display the border
        if (countryCode) {
          this.fetchAndDisplayCountryBorder(countryCode);

          // Populate airports and train stations based on the country code
          this.fetchAirports(countryCode);
          this.fetchTrains(countryCode);
          this.fetchCastles(countryCode);
          this.fetchUniversities(countryCode);
        }
      },
      (error) => {
        console.error("Could not fetch user location:", error);
      }
    );
  }

  // Function to fetch and display country border
  fetchAndDisplayCountryBorder(countryCode) {
    // console.log("Country Code:", countryCode);

    if (!countryCode) {
      console.error("Invalid country code");
      return;
    }

    const self = this; // Save context

    $.ajax({
      url: "./php/fetch_country_border.php",
      type: "POST",
      dataType: "json",
      success: function (result) {
        // console.log("Received data:", result);

        if (self.border && self.map.hasLayer(self.border)) {
          self.map.removeLayer(self.border);
        }

        const features = result.data.border.features;
        const filteredFeatures = features.filter(
          (feature) => feature.properties.iso_a2 === countryCode
        );

        if (filteredFeatures.length === 0) {
          console.error("No features found for the given country code");
          return;
        }

        self.border = L.geoJSON(filteredFeatures, {
          style: { color: "lime", weight: 3, opacity: 0.75 },
        }).addTo(self.map);

        if (!self.border) {
          console.error("Failed to create border layer");
          return;
        }

        const bounds = self.border.getBounds();

        if (!bounds.isValid()) {
          console.error("Invalid bounds");
          return;
        }

        self.map.flyToBounds(bounds, {
          padding: [35, 35],
          duration: 2,
        });
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log("Error:", textStatus, errorThrown);
      },
    });
  }

  addNewsButton() {
    L.easyButton({
      states: [
        {
          stateName: "fetch-news",
          icon: "fa-newspaper",
          title: "Fetch Country News",
          onClick: (btn, map) => {
            this.currentCountryName = this.currentCountryName || "GB";

            $.ajax({
              url: "php/fetch_news.php?newsCountry=" + this.currentCountryName,
              type: "GET",
              dataType: "json",
              success: (result) => {
                console.log(result);

                if (result && Array.isArray(result.articles)) {
                  let modalContent = "";

                  // Iterate through the news articles and build the modal content
                  result.articles.forEach((data) => {
                    modalContent += `
                      <div class="news-article">
                        <h5>${data.title}</h5>
                        <p>Author: ${data.author}</p>
                        <p>Published at: ${data.publishedAt}</p>
                        <p>Source: ${data.source.name}</p>
                        <a href="${data.url}" target="_blank">Read more</a>
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
}

// Declare wikidata at a broader scope
let wikidata;
// Declare currentCountryInfo at a broader scope
let currentCountryInfo = {};

(function () {
  // Initialize
  document.addEventListener("DOMContentLoaded", function () {
    const mapHandler = new MapHandler("mapid");

    // On page load, fetch countries and populate the dropdown
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
            options += `<option value="${country.cca2}">${country.name.common}</option>`;
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
    $("#country-select").change(function () {
      const selectedCountryAlpha3Code = $(this).val();
      const selectedCountryName = $(this).find("option:selected").text();

      // Update the current country name in mapHandler
      mapHandler.currentCountryName = selectedCountryName;

      if (selectedCountryAlpha3Code) {
        mapHandler.fetchAndDisplayCountryBorder(selectedCountryAlpha3Code); // Fetch and display border

        // Fetch airports and train stations based on the selected country
        mapHandler.fetchAirports(selectedCountryAlpha3Code);
        mapHandler.fetchTrains(selectedCountryAlpha3Code);
        mapHandler.fetchUniversities(selectedCountryAlpha3Code);
        mapHandler.fetchCastles(selectedCountryAlpha3Code);
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

          const [lng, lat] = countryFeature.geometry.coordinates;
          wikidata = countryFeature.properties.wikidata;
          mapHandler.map.setView([lat, lng], 6);
        },
        error: function (error) {
          console.error("Error fetching location data: ", error);
        },
      });
    });

    // Country Information fetch from Wiki

    async function fetchCountryDataForCentralLocation(lat, lon) {
      try {
        // Fetch country code and name based on latitude and longitude
        const geoResult = await $.ajax({
          url: `./php/fetch_geonames.php?lat=${lat}&lng=${lon}`,
          type: "GET",
          dataType: "json",
        });
        console.log(geoResult);
        console.log(`Latitude: ${lat}, Longitude: ${lon}`);

        const { countryCode, countryName } = geoResult;

        if (countryCode) {
          const countryResult = await $.ajax({
            url: `./php/fetch_country_info.php?countryCode=${countryCode}`,
            type: "GET",
            dataType: "json",
          });
          // console.log(countryResult);

          if (countryResult && countryResult[0]) {
            const countryInfo = countryResult[0];
            const name = countryInfo.name.common || "Unknown";
            const population = countryInfo.population || "Unknown";
            const flag =
              countryInfo.flags.svg || "path/to/default/flag/image.png";
            const capital = countryInfo.capital || "Unknown"; // New field
            const currencyInfo = countryInfo.currencies || {};
            const mainCurrencyCode = Object.keys(currencyInfo)[0] || "Unknown"; // Assuming the first key is the main currency
            const currencyName = currencyInfo[mainCurrencyCode]
              ? currencyInfo[mainCurrencyCode].name
              : "Unknown";

            // Existing code to populate the modal
            $("#country-title").html(`<h3>${name}</h3>`);
            $("#country-population").html(`<p>Population: ${population}</p>`);
            $("#country-flag").html(
              `<img src="${flag}" alt="Flag of ${name}" width="100">`
            );

            $("#country-capital").html(`<p>Capital: ${capital}</p>`);
            $("#country-currency").html(`<p>Currency: ${currencyName}</p>`);

            $("#country-info-modal").modal("show");
          } else {
            console.error("No country data found.");
          }
        } else {
          console.error("No country code found.");
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    }

    let infoButton = L.easyButton({
      id: "toggle-info-button",
      position: "topleft",
      type: "replace",
      leafletClasses: true,
      states: [
        {
          stateName: "show-info",
          onClick: function (button, map) {
            const center = map.getCenter();
            const lat = center.lat.toFixed(6);
            const lon = center.lng.toFixed(6);
            fetchCountryDataForCentralLocation(lat, lon);
          },
          title: "Show country info",
          icon: "fa-info",
        },
      ],
    });

    infoButton.addTo(mapHandler.map);

    ///////////////////////////////////

    // Adding EasyButton for currency conversion
    let currencyConversionButton = L.easyButton({
      id: "toggle-currency-conversion-button",
      position: "topleft",
      type: "replace",
      leafletClasses: true,
      states: [
        {
          stateName: "show-currency-conversion",
          onClick: function (button, map) {
            fetchAndDisplayCurrencyConversion();
          },
          title: "Show currency conversion",
          icon: "fa-exchange-alt", // No HTML tags, just the class name
        },
      ],
    });

    currencyConversionButton.addTo(mapHandler.map); // Add the button to the map

    let globalExchangeRates = null;

    // Function to fetch and display currency conversion
    async function fetchAndDisplayCurrencyConversion() {
      try {
        const exchangeRates = await $.ajax({
          url: "./php/fetch_exchange_rates.php",
          type: "GET",
          dataType: "json",
        });

        const center = mapHandler.map.getCenter();
        const lat = center.lat.toFixed(6);
        const lon = center.lng.toFixed(6);
        const countryAndCurrencyData = await $.ajax({
          url: `./php/fetch_geonames.php?lat=${lat}&lng=${lon}`,
          type: "GET",
          dataType: "json",
        });

        const currencyCode = countryAndCurrencyData.currencyCode;

        if (exchangeRates && exchangeRates.rates) {
          globalExchangeRates = exchangeRates.rates; // Update the global variable

          // Populate currency dropdowns
          const fromCurrencyDropdown = $("#from-currency");
          const toCurrencyDropdown = $("#to-currency");
          fromCurrencyDropdown.empty();
          toCurrencyDropdown.empty();

          Object.keys(exchangeRates.rates).forEach((currencyCode) => {
            fromCurrencyDropdown.append(new Option(currencyCode, currencyCode));
            toCurrencyDropdown.append(new Option(currencyCode, currencyCode));
          });

          // Set initial values
          fromCurrencyDropdown.val("GBP");
          toCurrencyDropdown.val(currencyCode);

          // Show the modal
          $("#currency-conversion-modal").modal("show");
        } else {
          console.error("No exchange rate data found.");
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    }

    // Function to set initial values for the dropdowns
    async function setInitialDropdownValues() {
      $("#from-currency").val("GBP"); // Set "From" currency to GBP

      // Get the country code for the map's central coordinates
      const center = mapHandler.map.getCenter();
      const lat = center.lat.toFixed(6);
      const lon = center.lng.toFixed(6);

      // Fetch country code and name based on latitude and longitude
      const geoResult = await $.ajax({
        url: `./php/fetch_geonames.php?lat=${lat}&lng=${lon}`,
        type: "GET",
        dataType: "json",
      });

      const { countryCode, countryName } = geoResult;

      // console.log(`Fetched country code: ${countryCode}`);

      if (countryCode) {
        // Check if the fetched countryCode exists in the dropdown options
        const exists = $("#to-currency option")
          .toArray()
          .some((option) => $(option).val() === countryCode);
        console.log(`Does the country code exist in the dropdown? ${exists}`);

        if (exists) {
          // Set "To" currency based on the country code of the map's central coordinates
          $("#to-currency").val(countryCode);
        }
      } else {
        console.error("No country code found.");
      }
    }

    // Form submission handling code
    $("#currency-converter-form").submit(function (event) {
      event.preventDefault();
      if (!globalExchangeRates) {
        console.error("Exchange rates not available");
        return;
      }

      const fromCurrency = $("#from-currency").val();
      const toCurrency = $("#to-currency").val();
      const amount = $("#amount").val();

      // GlobalExchangeRates here
      const rate =
        globalExchangeRates[toCurrency] / globalExchangeRates[fromCurrency];
      const convertedAmount = amount * rate;

      $("#conversion-result").text(
        `${amount} ${fromCurrency} is equal to ${convertedAmount.toFixed(
          2
        )} ${toCurrency}`
      );
    });

    //////////////////////////////////

    // current zoom
    // mapHandler.map.on("zoomend", function () {
    //   const zoomLevel = mapHandler.map.getZoom();
    //   document.getElementById("zoom-display").innerHTML = `Zoom: ${zoomLevel}`;
    // });
  });
})();
