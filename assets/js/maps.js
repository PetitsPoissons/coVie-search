(function(exports) {
    'use strict';
    var url = new URL(window.location)
    var lat = url.searchParams.get('lat');
    var lon = url.searchParams.get('lon');
    var coord;
    if (lat && lon) {
        coord = {
            lat: Number(lat),
            lng: Number(lon),
        };
    } else {
        // los angeles is default
        coord = {
            lat: 34.0522,
            lng: -118.2437
        };
    }
    // This example requires the Places library. Include the libraries=places
    // parameter when you first load the API. For example:
    // <script src=“https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places”>
    function initMap() {
        // Create the map.
        exports.map = new google.maps.Map(document.getElementById('map'), {
            center: coord,
            zoom: 8
        }); // Create the places service.
        var service = new google.maps.places.PlacesService(exports.map);
        var getNextPage = null;
        var moreButton = document.getElementById('more');
        moreButton.onclick = function () {
            moreButton.disabled = true;
            if (getNextPage) getNextPage();
        }; // Perform a nearby search.
        service.nearbySearch(
            {
                location: coord,
                radius: 5000,
                // ********************************************  from JB:  THIS IS WHERE WE ENTER THE TYPE ****************************************
                type: ['hospital']
            },
            function (results, status, pagination) {
                if (status !== 'OK') return;
                createMarkers(results);
                moreButton.disabled = !pagination.hasNextPage;
                getNextPage =
                    pagination.hasNextPage &&
                    function () {
                        pagination.nextPage();
                    };
            }
        );
    }
    function createMarkers(places) {
        var bounds = new google.maps.LatLngBounds();
        var placesList = document.getElementById('places');
        for (var i = 0, place; (place = places[i]); i++) {
            var image = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };
            var marker = new google.maps.Marker({
                map: exports.map,
                icon: image,
                title: place.name,
                position: place.geometry.location
            });
            var li = document.createElement('li');
            li.textContent = place.name;
            placesList.appendChild(li);
            bounds.extend(place.geometry.location);
        }
        exports.map.fitBounds(bounds);
    }
    exports.createMarkers = createMarkers;
    exports.initMap = initMap;
}) ((this.window = this.window || {}));