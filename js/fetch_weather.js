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
        // Display weather data
        console.log("Weather data:", data);
      },
      error: function (error) {
        console.error("Error fetching weather data: ", error);
      },
    });
  } else {
    console.log("User location is not available for fetching weather");
  }
}
