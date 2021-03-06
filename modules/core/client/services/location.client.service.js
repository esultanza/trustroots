(function() {
  'use strict';

  /**
   * Service for querying MapBox geocoder
   */
  angular
    .module('core')
    .factory('LocationService', LocationService);

  /* @ngInject */
  function LocationService($http, SettingsFactory) {

    var appSettings = SettingsFactory.get();

    // Defaults location to be used with maps (Europe)
    var defaultLocation = {
      lat: 48.6908333333,
      lng: 9.14055555556,
      zoom: 6
    };

    var service = {
      getDefaultLocation: getDefaultLocation,
      getBounds: getBounds,
      getCenter: getCenter,
      shortTitle: shortTitle,
      suggestions: suggestions,
    };

    /**
     * Default map center
     * Return Angular-UI-Leaflet compatible map center with optionally pre-set zoom level
     *
     * Leaflet expects center to be:
     * {
     *   lat: Float,
     *   lng: Float,
     *   center: Int
     * }
     */
    function getDefaultLocation(zoom) {
      return {
        lat: defaultLocation.lat,
        lng: defaultLocation.lng,
        zoom: parseInt(zoom) || defaultLocation.zoom,
      };
    }

    /**
     * Return Angular-UI-Leaflet compatible bounding box object from Carmen Geojson object
     * @link https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
     *
     * Leaflet expects bounds object to be:
     * {
     *   'northEast': {
     *     'lat':59.60109549032134,
     *     'lng':42.099609375
     *   },
     *   'southWest':{
     *     'lat':52.796119005678506,
     *     'lng':25.24658203125
     *   }
     * }
     */
    function getBounds(geolocation) {
      if(!geolocation || !geolocation.bbox || !angular.isArray(geolocation.bbox) || geolocation.bbox.length !== 4) {
        return false;
      }
      return {
        'northEast': {
          'lat': parseFloat(geolocation.bbox[3]),
          'lng': parseFloat(geolocation.bbox[2])
        },
        'southWest': {
          'lat': parseFloat(geolocation.bbox[1]),
          'lng': parseFloat(geolocation.bbox[0])
        }
      };
    }

    /**
     * Return Angular-UI-Leaflet compatible center object from Carmen Geojson object
     * @link https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
     *
     * Leaflet expects center to be:
     * {
     *   lat: Float,
     *   lng: Float,
     *   center: Int
     * }
     */
    function getCenter(geolocation) {
      var coords;

      if(geolocation.center) {
        coords = geolocation.center;
      }
      else if(geolocation.geometry && geolocation.geometry.coordinates) {
        coords = geolocation.geometry.coordinates;
      }

      // Nothing found, return old or false
      if(!coords || !angular.isArray(coords) || coords.length !== 2) {
        return false;
      }

      // Return coordinates
      return {
        lng: parseFloat(coords[0]),
        lat: parseFloat(coords[1])
      };
    }

    /**
     * Search field's typeahead -suggestions
     *
     * @link https://www.mapbox.com/api-documentation/#geocoding
     *
     * @param val String Search query
     * @param types String (optional) Filter results by one or more type.
     *                     Options are  country,  region,  postcode,  place,  locality,  neighborhood,  address,  poi.
     *                     Multiple options can be comma-separated.
     *                     Defaults to `country,region,place,locality,neighborhood`
     */
    function suggestions(val, types) {
      if(!appSettings.mapbox || !appSettings.mapbox.publicKey) {
        return [];
      }

      return $http
        .get(
          '//api.mapbox.com/geocoding/v5/mapbox.places/' + val + '.json' +
            '?access_token=' + appSettings.mapbox.publicKey +
            '&types=' + (types || 'country,region,place,locality,neighborhood'),
          {
            // Tells Angular-Loading-Bar to ignore this http request
            // @link https://github.com/chieffancypants/angular-loading-bar#ignoring-particular-xhr-requests
            ignoreLoadingBar: true
          }
        )
        .then(function(response) {
          if(response.status === 200 && response.data.features && response.data.features.length > 0) {
            return response.data.features.map(function(geolocation) {
              geolocation.trTitle = shortTitle(geolocation);
              return geolocation;
            });
          }
          else return [];
        });
    }

    /**
     * Compile a nice title from geolocation, eg. "Jyväskylä, Finland"
     * @link https://www.mapbox.com/api-documentation/#geocoding
     * @link https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
     *
     * @param geolocation Object Carmen GeoJSON
     * @return String
     */
    function shortTitle(geolocation) {
      var title = '',
          titlePostfix = null;

      if(geolocation.text) {
        title = geolocation.text;

        // Relevant context strings
        if(geolocation.context) {
          var contextLength = geolocation.context.length;
          for (var i = 0; i < contextLength; i++) {
            if(geolocation.context[i].id.substring(0, 6) === 'place.') {
              title += ', ' + geolocation.context[i].text;
            }
            else if(geolocation.context[i].id.substring(0, 8) === 'country.') {
              title += ', ' + geolocation.context[i].text;
            }
          }
        }

      }
      else if(geolocation.place_name) {
        title = geolocation.place_name;
      }

      return title;
    }


    return service;
  }

})();
