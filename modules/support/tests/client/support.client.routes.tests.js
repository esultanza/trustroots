(function () {
  'use strict';

  describe('Support Route Tests', function () {
    // Initialize global variables
    var $scope;

    // We can start by loading the main application module
    beforeEach(module(AppConfig.appModuleName));

    beforeEach(inject(function ($rootScope) {
      // Set a new global scope
      $scope = $rootScope.$new();
    }));

    describe('Route Config', function () {
      describe('Main Route (support)', function () {
        var mainstate;
        beforeEach(inject(function ($state, $templateCache) {
          // Test expected GET request
          $templateCache.put('/modules/support/views/support.client.view.html', '');

          mainstate = $state.get('support');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/support?report=');
        });

        it('Should not be abstract', function () {
          expect(mainstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(mainstate.templateUrl).toBe('/modules/support/views/support.client.view.html');
        });
      });

      describe('Alternative Route (contact)', function () {
        var mainstate;
        beforeEach(inject(function ($state, $templateCache) {
          // Test expected GET request
          $templateCache.put('/modules/support/views/support.client.view.html', '');

          mainstate = $state.get('contact');
        }));

        it('Should have the correct URL (contact)', function () {
          expect(mainstate.url).toEqual('/contact');
        });

        it('Should not be abstract', function () {
          expect(mainstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(mainstate.templateUrl).toBe('/modules/support/views/support.client.view.html');
        });
      });

      describe('Handle Trailing Slash', function () {
        beforeEach(inject(function ($state, $rootScope, $templateCache, _Authentication_) {
          // Test expected GET request
          $templateCache.put('/modules/support/views/support.client.view.html', '');

          $state.go('support');
          $rootScope.$digest();
        }));

        it('Should remove trailing slash', inject(function ($state, $location, $rootScope) {
          $location.path('support/');
          $rootScope.$digest();

          expect($location.path()).toBe('/support');
        }));
      });

    });
  });
})();
