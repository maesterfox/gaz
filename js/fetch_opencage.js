function fetchOpenCageData(query) {
  $.ajax({
    url: "./php/fetch_opencage.php",
    type: "GET",
    data: { query: query },
    success: function (data) {
      // Check if the 'results' property exists in the response
      if (data.results && data.results.length > 0) {
        // Access the first result (you can loop through all results if needed)
        const firstResult = data.results[0];
        const lat = firstResult.geometry.lat;
        const lon = firstResult.geometry.lng;
        const displayName = firstResult.formatted;

        // Here you could add a marker or zoom the map to this location
        mymap.setView([lat, lon], 13);
      } else {
        console.log("No results found");
      }
    },
    error: function (error) {
      console.error("Error fetching OpenCage data: ", error);
    },
  });
}
