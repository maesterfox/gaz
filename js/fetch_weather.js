// Updated fetchWeatherData function
function fetchWeatherData(cityName) {
  $.ajax({
    url: "./php/fetch_weather.php",
    type: "GET",
    data: { city: cityName },
    success: function (data) {
      const parsedData = JSON.parse(data);
      const temperature = parsedData.main.temp;
      const description = parsedData.weather[0].description;
      const city = parsedData.name; // Get the city name from the weather data
      const country = parsedData.sys.country; // Get the country code from the weather data

      // Update the HTML elements with the weather information

      $("#weather1").text(`Temperature: ${temperature}°C`);
      $("#weather2").text(`Description: ${description}`);
      $("#weather3").text(`City: ${city}, Country: ${country}`);

      $("#weather-modal").modal("show");
    },
    error: function (error) {
      console.error("Error fetching data: ", error);
    },
  });
}
