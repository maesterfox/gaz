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

// Class to centralize AJAX operations
class APIHandler {
  // Method to execute a generic AJAX call and return a promise
  makeAjaxCall(url, type, dataType, data) {
    return new Promise((resolve, reject) => {
      // Execute the AJAX request
      $.ajax({
        url: url,
        type: type,
        dataType: dataType,
        data: data,
        // Fulfill the promise upon a successful AJAX call
        success: resolve,
        // Reject the promise upon an error
        error: reject,
      });
    });
  }

  // Method to execute an AJAX call with URL parameters and return a promise
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
    // to improve the performance of your application by minimizing redundant API calls
    this.dataCache = {}; // Initialize empty cache
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
      console.log("fetchWikipediaForCentralLocation called");

      if (!lat || !lon) {
        const center = map.getCenter();
        lat = center.lat.toFixed(6);
        lon = center.lng.toFixed(6);
      }

      console.log("Sending lat:", lat, " lon:", lon);

      // Fetch basic Geonames information
      const result = await this.makeAjaxCall(
        "./php/fetch_wikipedia.php",
        "GET",
        "json",
        { lat: lat, lon: lon }
      );

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

let userLocationMarker = null;

const airportIcon = L.icon({
  iconUrl: "./plane.gif",
  iconSize: [32, 32], // size of the icon
});

const trainStationIcon = L.icon({
  iconUrl: "./train.gif",
  iconSize: [32, 32], // size of the icon
});

// MapHandler Class
class MapHandler extends APIHandler {
  constructor(mapId) {
    super(); // Call super before using 'this'
    this.map = L.map(mapId); // Now it's okay to use 'this'
    this.dataCache = {};
    this.currentCountryName = null;
    this.singleMarker = null; // Initialize to null
    this.airportLayer = L.layerGroup(); // Initialize airport layer
    this.trainStationLayer = L.layerGroup(); // Initialize train station layer
    this.standardLayer = L.tileLayer(OPEN_STREET_MAP_URL, {
      maxZoom: 19,
    }).addTo(this.map);
    this.satelliteLayer = L.tileLayer(GOOGLE_SATELLITE_URL, { maxZoom: 19 });
    this.weatherAPI = new WeatherAPI();
    this.locationCache = {};
    this.geoJsonLayer = null; // Add this line to store the GeoJSON layer
    this.init();
  }

  init() {
    console.log("Init function called");
    this.initializeMap();
    this.initializeButtons();
    this.fetchAndSetUserLocation();
    console.log("fetchAndSetUserLocation is called");

    this.initializeLayerControl();
  }

  initializeLayerControl() {
    console.log("Initializing layer control"); // Debugging log

    const baseMaps = {
      Standard: this.standardLayer,
      Satellite: this.satelliteLayer,
    };

    const overlayMaps = {
      Airports: this.airportLayer,
      TrainStations: this.trainStationLayer, // Add this line
    };

    L.control
      .layers(baseMaps, overlayMaps, { position: "topright" })
      .addTo(this.map);

    this.map.on("overlayadd overlayremove", async (event) => {
      if (event.name === "Airports") {
        await this.toggleAirportsLayer(event.type === "overlayadd");
      } else if (event.name === "TrainStations") {
        // Add this block
        await this.toggleTrainStationsLayer(event.type === "overlayadd");
      }
    });
  }

  initializeMap() {
    this.map.invalidateSize();
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

    // Wikipedia Button
    this.addButton(
      this.map,
      "fetch-wikipedia",
      '<img src="wiki.gif" width="20" height="20">',
      "Fetch Wikipedia Info",
      (btn, map) => {
        const wikipediaAPI = new WikipediaAPI();
        wikipediaAPI.fetchWikipediaForCentralLocation(map);
      }
    );

    this.addNewsButton(); // Initialize the news button

    // Weather Button
    this.addButton(
      this.map,
      "show-weather",
      '<img src="weather.gif" width="20" height="20">',
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

      // Store the result in cache
      this.dataCache[cacheKey] = geoResult;

      return geoResult;
    } catch (error) {
      console.error("Error fetching country data:", error);
      return {};
    }
  }

  // Method to toggle the Airports layer on or off
  async toggleAirportsLayer(show) {
    if (show) {
      // Fetch the current country based on central coordinates
      const center = this.map.getCenter();
      const lat = center.lat.toFixed(6);
      const lon = center.lng.toFixed(6);

      // Fetch country data using fetchCountryDataForCentralLocation
      const countryData = await this.fetchCountryDataForCentralLocation(
        lat,
        lon
      );

      // Specify the desired maximum number of rows
      const maxRows = 50;

      // Fetch airports data based on the country code, language, and maximum rows
      const airportsData = await this.fetchAirports("en", lat, lon, maxRows);

      // Check if airportsData contains valid data
      if (
        Array.isArray(airportsData.results) &&
        airportsData.results.length > 0
      ) {
        // Extract and process airport data from the response
        const airports = airportsData.results.map((result) => ({
          lat: result.lat,
          lon: result.lon,
          name: result.name,
          address: result.address, // additional info
          rating: result.rating, // additional info
        }));

        // Populate this.airportLayer with the extracted airport data
        airports.forEach((airport) => {
          const popupContent = `
                <strong>${airport.name}</strong><br>
                Address: ${airport.address}<br>
                Rating: ${airport.rating}
            `;

          const marker = L.marker([airport.lat, airport.lon], {
            icon: airportIcon,
          }).bindPopup(popupContent);

          this.airportLayer.addLayer(marker);
        });
      } else {
        console.error("No airport data found.");
      }
    } else {
      // Remove existing airport markers from the layer
      this.airportLayer.clearLayers();
    }
  }

  // Fetch Airports
  fetchAirports(lang, lat, lon, maxRows) {
    const params = { lang, lat, lon, maxRows };
    return this.makeParameterizedAjaxCall("./php/fetch_airports.php", params);
  }

  // New method to toggle the TrainStations layer on or off
  async toggleTrainStationsLayer(show) {
    if (show) {
      const center = this.map.getCenter();
      const lat = center.lat.toFixed(6);
      const lon = center.lng.toFixed(6);

      // Fetch train stations data based on the language, latitude, longitude, and maximum rows
      const trainStationsData = await this.fetchTrainStations(
        "en",
        lat,
        lon,
        50
      );

      if (
        Array.isArray(trainStationsData.results) &&
        trainStationsData.results.length > 0
      ) {
        const trainStations = trainStationsData.results.map((result) => ({
          lat: result.lat,
          lon: result.lon,
          name: result.name,
          address: result.address, // additional info
          rating: result.rating, // additional info
        }));

        trainStations.forEach((station) => {
          const popupContent = `
          <strong>${station.name}</strong><br>
          Address: ${station.address}<br>
          Rating: ${station.rating}
        `;

          const marker = L.marker([station.lat, station.lon], {
            icon: trainStationIcon,
          }).bindPopup(popupContent);

          this.trainStationLayer.addLayer(marker);
        });
      } else {
        console.error("No train station data found.");
      }
    } else {
      this.trainStationLayer.clearLayers();
    }
  }

  // Fetch Train Stations
  fetchTrainStations(lang, lat, lon, maxRows) {
    const params = { lang, lat, lon, maxRows };
    return this.makeParameterizedAjaxCall("./php/fetch_trains.php", params);
  }

  fetchAndSetUserLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.map.setView([latitude, longitude], 5);

        // Create and set the singleMarker
        this.singleMarker = L.marker([latitude, longitude]).addTo(this.map);
        this.singleMarker.bindPopup("You are here").openPopup();

        // Use "GBR" as the country code for the United Kingdom
        const countryCode = "GBR";

        // Fetch and display the border
        this.fetchAndDisplayCountryBorder(countryCode);
      },
      (error) => {
        console.error("Could not fetch user location:", error);
      }
    );
  }

  // Function to fetch and display country border
  fetchAndDisplayCountryBorder(countryCode) {
    console.log(countryCode);

    if (!countryCode) {
      console.error("Invalid country code");
      return;
    }

    // Load the GeoJSON file
    $.ajax({
      url: `./php/fetch_country_border.php?countryCode=${countryCode}`, // Adjust the URL as needed
      type: "GET",
      dataType: "json",
      success: (result) => {
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
          icon: "fa-exchange-alt",
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
    mapHandler.map.on("zoomend", function () {
      const zoomLevel = mapHandler.map.getZoom();
      document.getElementById("zoom-display").innerHTML = `Zoom: ${zoomLevel}`;
    });
  });
})();
