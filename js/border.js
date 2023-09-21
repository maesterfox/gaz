// Function to fetch country border information

function fetchCountryBorder(countryCode) {
  if (!countryCode) {
    console.error("Invalid country code");
    return;
  }

  // AJAX call to PHP backend to fetch country border information
  $.ajax({
    url: `php/fetch_country_border.php?countryCode=${countryCode}`,
    type: "GET",
    dataType: "json",
    success: function (result) {
      console.log("Success response:", result);

      if (result.status === 200) {
        const borderCoordinates = result.data.borders; // Replace with actual key for borders
        // Add your logic to render the border on the map
      } else {
        console.error("Server response was not ok");
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error(`Fetch error: ${textStatus}`);
      console.error("Error details:", errorThrown);
      console.error("Full response object:", jqXHR);
    },
  });
}
