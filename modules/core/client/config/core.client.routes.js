(function() {
  'use strict';

  angular
    .module('core')
    .config(CoreRoutes);

  /* @ngInject */
  function CoreRoutes($stateProvider, $urlRouterProvider) {

    // Remove trailing slash from routes
    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.path();
      var hasTrailingSlash = path.length > 1 && path[path.length - 1] === '/';

      if (hasTrailingSlash) {

        // If last character is a slash, return the same url without the slash
        var newPath = path.substr(0, path.length - 1);
        $location.replace().path(newPath);
      }
    });

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise('not-found');

    // Home state routing
    // Note: Actual front page is configured at `pages` module
    $stateProvider.
      state('not-found', {
        url: '/not-found',
        templateUrl: '/modules/core/views/404.client.view.html',
        footerHidden: true,
        headerHidden: true
      });
  }

})();
