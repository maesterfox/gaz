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
      lat = center.lat.toFixed(4);
      lon = center.lng.toFixed(4);
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
          result.placeInfo.geonames.length > 0 &&
          result.wikipediaInfo &&
          result.wikipediaInfo.geonames &&
          result.wikipediaInfo.geonames.length > 0
        ) {
          const placeName = result.placeInfo.geonames[0].adminName1;
          const countryName = result.placeInfo.geonames[0].countryName;
          const title = result.wikipediaInfo.geonames[0].title;
          const wikipediaSummary = result.wikipediaInfo.geonames[0].summary;

          const infoHtml = `
            <div>
              <img src="lost.gif" width="150" height="150">
              <h2>${title}</h2>
              <h3>${placeName}</h3>
              <h4>${countryName}</h4>
              <p>${wikipediaSummary}</p>
            </div>
            `;

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
    this.areAsylumsDisplayed = false; // New state variable for asylums
    this.asylumMarkers = []; // New array to store asylum markers
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

  toggleAsylumDisplay() {
    this.areAsylumsDisplayed = !this.areAsylumsDisplayed;
  }
  clearAsylums(map) {
    this.asylumMarkers.forEach((marker) => {
      map.removeLayer(marker);
    });
    this.asylumMarkers = [];
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
  async fetchInsaneAsylums(map, wikipediaAPI) {
    // If asylums are already displayed, remove them
    if (this.areAsylumsDisplayed) {
      this.asylumMarkers.forEach((marker) => {
        map.removeLayer(marker);
      });
      this.asylumMarkers = [];
      this.areAsylumsDisplayed = false;
    } else {
      const featureCode = "UNIV"; // Feature code for insane asylums
      const iconUrl = "./img/uni.gif"; // Icon URL for insane asylums
      const maxRows = 100; // Limit to 50 asylums
      const bounds = map.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const asylumIcon = L.icon({
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
            const asylums = result.geonames;
            asylums.forEach((asylum) => {
              const popupContent = document.createElement("div");
              const title = document.createElement("h3");
              title.textContent = asylum.name;

              // Create a button to fetch Wikipedia data
              const triggerWikipediaButton = document.createElement("button");
              triggerWikipediaButton.textContent = "Wikipedia";
              triggerWikipediaButton.addEventListener("click", () => {
                map.panTo([asylum.lat, asylum.lng]); // Center the map to the asylum
                wikipediaAPI.fetchWikipediaForCentralLocation(
                  map,
                  asylum.lat,
                  asylum.lng
                );
              });

              // Create Zoom button
              const zoomButton = document.createElement("button");
              zoomButton.textContent = "Zoom In";
              zoomButton.addEventListener("click", () =>
                map.setView([asylum.lat, asylum.lng], 17)
              );

              // Append buttons to popup content
              popupContent.appendChild(title);
              popupContent.appendChild(triggerWikipediaButton);
              popupContent.appendChild(zoomButton);

              const marker = L.marker([asylum.lat, asylum.lng], {
                icon: asylumIcon,
              }).addTo(map);
              marker.bindPopup(popupContent);
              this.asylumMarkers.push(marker); // Store the marker
            });
            this.areAsylumsDisplayed = true; // Update the display state
          } else {
            console.error("No insane asylums found.");
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
    this.geoNamesAPI = new GeoNamesAPI();
    this.locationCache = {};
    this.nuclearMarkers = [];

    this.init();
  }

  init() {
    this.locateUser();
    this.addLayerToggle();
    this.addLayersControlButton(); // New: Add layers control button
    this.addLocationButton();
    this.addWeatherButton();
    this.geoNamesAPI.addCitiesAndAirportsButton(this.map);
    this.addWikipediaButton();
    this.addNuclearToggleButton();
    this.addLandmarkButton();
    this.addAsylumButton(); // Add this line to initialize the asylum button
    this.map.on("locationfound", this.onLocationFound.bind(this));
  }

  locateUser() {
    this.map.locate({ setView: true, maxZoom: 7 });
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

  addNuclearMarkers(data) {
    const coordinates = data.map((item) => {
      return [
        parseFloat(item["Location.Cordinates.Latitude"]),
        parseFloat(item["Location.Cordinates.Longitude"]),
      ];
    });
    for (let i = 0; i < coordinates.length; i++) {
      const marker = L.marker([coordinates[i][0], coordinates[i][1]]);
      marker.addTo(this.map);
      this.nuclearMarkers.push(marker);
    }
  }

  removeNuclearMarkers() {
    for (let i = 0; i < this.nuclearMarkers.length; i++) {
      this.map.removeLayer(this.nuclearMarkers[i]);
    }
    this.nuclearMarkers = [];
  }

  addNuclearToggleButton() {
    console.log("Function addNuclearToggleButton called");

    L.easyButton({
      states: [
        {
          stateName: "show-nuclear",
          icon: "/img/nuclear.gif",
          title: "Show Nuclear Explosions",
          onClick: (btn, map) => {
            $.ajax({
              url: "php/read_csv.php",
              type: "GET",
              dataType: "json",
              success: (data) => {
                this.addNuclearMarkers(data);
                btn.state("hide-nuclear");
              },
              error: (error) => {
                console.error("Error fetching data: ", error);
              },
            });
          },
        },
        {
          stateName: "hide-nuclear",
          icon: "fa-times",
          title: "Hide Nuclear Explosions",
          onClick: (btn, map) => {
            this.removeNuclearMarkers();
            btn.state("show-nuclear");
          },
        },
      ],
    }).addTo(this.map);
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

  addLayersControlButton() {
    // Define the base layers
    const baseLayers = {
      Standard: this.standardLayer,
      Satellite: this.satelliteLayer,
    };

    // Create a layers control and add it to the map
    const layersControl = L.control.layers(baseLayers, null, {
      position: "topright",
    });
    layersControl.addTo(this.map);

    // Create a custom button for toggling the layers control
    L.easyButton({
      id: "layer-toggle-button",
      position: "topright",
      type: "Layers",
      leafletClasses: true,
      states: [
        {
          stateName: "show-layers",
          icon: '<img src="img/slayers.png" width="20" height="20">', // Replace with your layers icon
          title: "Show Layers",
          onClick: function (btn, map) {
            layersControl.addTo(map); // Add the layers control to the map
            btn.state("hide-layers"); // Update the button state
          },
        },
        {
          stateName: "hide-layers",
          icon: '<img src="img/hlayers.png" width="20" height="20">', // Replace with your layers icon
          title: "Hide Layers",
          onClick: function (btn, map) {
            map.removeControl(layersControl); // Remove the layers control from the map
            btn.state("show-layers"); // Update the button state
          },
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

  // addWikipediaButton() {
  //   L.easyButton({
  //     states: [
  //       {
  //         stateName: "show-wikipedia",
  //         icon: '<img src="wiki.gif" width="20" height="20">', // Use your Wikipedia image
  //         title: "Toggle Wikipedia",
  //         onClick: (btn, map) => {
  //           this.wikipediaAPI.fetchWikipediaForCentralLocation(
  //             this.map,
  //             this.locationCache
  //           );
  //         },
  //       },
  //     ],
  //   }).addTo(this.map);
  // }

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

  addAsylumButton() {
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

    const asylumButtonConfig = generateButtonConfig(
      "show-asylums",
      "img/uni.gif", // Corrected: Path to your asylum image
      "Toggle Universities",
      async (btn, map) => {
        if (!this.geoNamesAPI.areAsylumsDisplayed) {
          await this.geoNamesAPI.fetchInsaneAsylums(map, this.wikipediaAPI);
        } else {
          this.geoNamesAPI.clearAsylums(map);
        }
        this.geoNamesAPI.toggleAsylumDisplay();
      }
    );

    L.easyButton({
      states: [asylumButtonConfig],
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
