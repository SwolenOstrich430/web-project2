$(function () {
  // Save home to favorites button action
  $(".save-home-button").on("click", function (e) {
    e.stopPropagation();
    let button = $(this).children();
    button.toggleClass("font-weight-bold");

    var id = $(this).attr("id");

    // Get values from the elements
    var picURL = $("#pic-url-" + id).attr("src");
    var address = $("#house-address-" + id).text();
    var numBeds = $("#bedrooms-" + id).text();
    var numBathrooms = $("#bathrooms-" + id).text();
    var sqf = $("#sqft-" + id).text();
    var price = $("#price-" + id).text();

    // Conversions to match database table constraints
    // Get street, city, zip from address;
    var addressArray = address.split(",");
    var street = addressArray[0].trim();
    var city = addressArray[1].trim();
    var zipCode = addressArray[2].trim();

    // Convert price from string to float, remove the first $ sign first
    price = price.substring(1);
    price = parseFloat(price.replace(/,/g, ""));

    // Convert bedrooms and bathrooms to integer
    numBeds = parseInt(numBeds);
    numBathrooms = parseInt(numBathrooms);

    // Remove text part of the sqf and comma, then convert to integer
    sqf = 0;
    if (sqf) {
      var index = sqf.indexOf("sq");
      sqf = sqf.substring(0, index).trim();
      sqf = parseInt(sqf.replace(/,/g, ""));
    }

    var property = {};
    property["street"] = street;
    property["city"] = city;
    property["zipCode"] = zipCode;
    property["numBeds"] = numBeds;
    property["numBathrooms"] = numBathrooms;
    property["sqf"] = sqf;
    property["picURL"] = picURL;
    property["price"] = price;

    $.post("/api/property", property, function (data) {
      var favorite = {
        //userId: 1,
        propertyId: data.id
      };

      $.ajax({
        url: "/api/favorites",
        method: "POST",
        headers: {
          token: localStorage.getItem("jwt")
        },
        data: favorite
      });
    });
  });

  // When Saved Favorites button is clicked
  var handleGetFavoritesBtn = function () {
    
    $.ajax({
      url: "/api/favorites",
      method: "GET",
      headers: {
        token: localStorage.getItem("jwt")
      },
      dataType: 'html'
    }).done(function (data) {

      document.open();
      document.write(data);
      document.close();
    });

  };

  // Add Get Favorites button listeners 
  $("#get-favorites").on("click", handleGetFavoritesBtn);

  // When delete favorite button is clicked
  var handleDeleteFavoritesBtn = function () {
    
    event.stopPropagation();
    var id = $(this).data("id");
    $.ajax({
      method: "DELETE",
      url: "/api/favorites/" + id
    }).done(handleGetFavoritesBtn);
  };

  // Add Delete Favorite button listeners 
  $(".delete-favorites").on("click", handleDeleteFavoritesBtn);
});

$(".contact-agent-button").on("click", function() {
    var realtorId = $(this).data("realtorid");

    location.href = "/users/chat/" + "?realtorId=" + realtorId + "&token=" + localStorage.getItem("jwt") ;
})

$(".exit-modal-button").on("click", function() {
    $(".modal-container").addClass("off");
});

// Show property details in modal
$(".home-preview-card").on("click", function () {
    q = $(this);
    $(".modal-container").removeClass("off");

    $(".property-price").text($(this).data("price"));
    
    var numBaths = document.getElementsByClassName("num-bed");
    var numBeds = document.getElementsByClassName("num-bath");
    var sqrft = document.getElementsByClassName("sqrft");

    for(let i = 0; i < numBaths.length; i++) {
        numBaths[i].textContent = $(this).data("bathrooms");
    }

    for(let j = 0; j < numBeds.length; j++) {
        numBeds[j].textContent = $(this).data("bedrooms");
    }

    for(let w = 0; w < sqrft.length; w++) {
        sqrft[w].textContent = $(this).data("sqft");
    }

    var price = $(this).data("price");

    price = price.substring(1).replace(",", "");
    var monthlyPrice = Math.round(parseInt(price) / 30, 2);

    $(".monthly-price").text(" " + monthlyPrice);

    $(".address-modal-display").text($(this).data("address"));
    var address = $(this).data("address").replace(" ", "+");

    var url = "https://www.google.com/maps/embed/v1/streetview?location=" + $(this).data("lat") + "," + $(this).data("lng") + "&key=AIzaSyA9RYFLOsAjw3UtphZfNyO8DHo8fCwmJn8";
    $(".street-view-iframe").attr("src", url);
    $(".main-property-image").attr("src", $(this).data("imgurl"));
});

// Google Maps API
var infoObj = [];

function initMap() {
  // Map options
  var options = {
    zoom: 10,
    center: $(".home-preview-card").data(),
    fullscreenControl: false
  };
  // New map
  var map = new google.maps.Map(document.getElementById("map"), options);

  // Array of markers
  var markers = [];
  // Loop through all properties elements and create marker info
  $(".home-preview-card").each(function (house) {
    let data = $(this).data();
    // Create content for marker popup
    let content =
      "<a href='#' class='house-mini-view'><div class='mini-view-image'><img id='map-mini-image' src='" +
      data.imgurl +
      "'></div><div class='mini-view-details'><span class='font-weight-bold'>" +
      data.price +
      "</span><div>" +
      data.bedrooms +
      " bd, " +
      data.bathrooms +
      " ba</div><di>" +
      data.sqft +
      "</di></div></a>";
    let coords = $(this).data();
    markers.push({ coords: coords, content: content });
  });

  // Loop through markers
  for (var i = 0; i < markers.length; i++) {
    // Add marker
    addMarker(markers[i]);
  }

  // Add Marker Function
  function addMarker(props) {
    // Marker Custom icon
    var iconImage = "/img/map-marker-icon.png";
    var marker = new google.maps.Marker({
      position: props.coords,
      map: map
    });

    if (iconImage) {
      // Set icon image
      marker.setIcon(iconImage);
    }

    // Check content
    if (props.content) {
      var infoWindow = new google.maps.InfoWindow({
        content: props.content
      });

      // Display popup on marker hover
      marker.addListener("mouseover", function () {
        closeOtherInfo();
        infoWindow.open(map, marker);
        infoObj[0] = infoWindow;
      });

      function closeOtherInfo() {
        if (infoObj.length > 0) {
          // detach the info-window from the marker
          infoObj[0].set("marker", null);
          // and close it
          infoObj[0].close();
          // blank the array
          infoObj.length = 0;
        }
      }
    }


    /*=============================================
  =        Autocomplete Places Search           =
  =============================================*/
    // Variable will be use to store details of input address: City's name, State, postal code, latitude and longitude.
    var addressData = {};

    //Loads route => /houses/:zipcode
    let getHomesForSaleData = function (zipcode) {
        window.location.href = "/houses/" + zipcode;
    }

    var placesAutocomplete = places({
        appId: "plUZWS470NUB",
        apiKey: "d8417e1882d8024fb43cf8a17e547c76",
        container: document.getElementsByClassName("input-address")[0]
    });

    placesAutocomplete.on("change", function (e) {
        // Create object with location data
        addressData.city = e.suggestion.name || "";
        addressData.state = e.suggestion.administrative || "";
        addressData.zip = e.suggestion.postcode || "";
        addressData.lat = e.suggestion.latlng.lat || "";
        addressData.lng = e.suggestion.latlng.lng || "";
        getHomesForSaleData(addressData.zip);
    });

    /*=============================================
    =              Geolocation API               =
    =============================================*/
    var locations = algoliasearch.initPlaces(
        "plUZWS470NUB",
        "d8417e1882d8024fb43cf8a17e547c76"
    );

    function getCurrentAddress(response) {
        var hits = response.hits;
        var suggestion = hits[0];
        // Create object with location data
        if (suggestion && suggestion.locale_names && suggestion.city) {
            addressData.city = suggestion.city.default[0] || "";
            addressData.state = suggestion.administrative[0] || "";
            addressData.zip = (suggestion.postcode || [])[0] || "";
            addressData.lat = (suggestion._geoloc.lat || "");
            addressData.lng = (suggestion._geoloc.lng || "");
            getHomesForSaleData(addressData.zip);
        }
    }

    var $button = document.getElementsByClassName("ap-icon-pin")[0];
    $button.addEventListener("click", function () {
        navigator.geolocation.getCurrentPosition(function (response) {
            var coords = response.coords;
            lat = coords.latitude.toFixed(6);
            lng = coords.longitude.toFixed(6);
            locations
                .reverse({
                    aroundLatLng: lat + "," + lng,
                    hitsPerPage: 1
                })
                .then(getCurrentAddress);
        });
    });
  }
}

var chatButton = document.querySelector(".chat-button");
var logoutButton = document.querySelector(".logout-button");

function getLoggedInElements() {
  const loggedInElems = document.getElementsByClassName("logged-in");
  const loggedOutElems = document.getElementsByClassName("logged-out");

  for (const loggedInElem of loggedInElems) {
    loggedInElem.getElementsByClassName.display = "inline-block";
  }

  for (const loggedOut of loggedOutElems) {
    loggedOut.style.display = "none";
  }
}

function getLoggedOutElems() {
  const loggedInElems = document.getElementsByClassName("logged-in");
  const loggedOutElems = document.getElementsByClassName("logged-out");

  for (const loggedInElem of loggedInElems) {
    loggedInElem.style.display = "none";
  }

  for (const loggedOut of loggedOutElems) {
    loggedOut.style.display = "inline-block";
  }
}

if (localStorage.getItem("jwt")) {
  getLoggedInElements();
} else {
  getLoggedOutElems();
}

logoutButton.addEventListener("click", event => {
  localStorage.removeItem("jwt");
  location.reload();
});

