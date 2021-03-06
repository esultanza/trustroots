(function() {
  'use strict';

  /**
   * Directive show unread messages counter
   *
   * Usage:
   * `<div messages-unread-count></div>`
   *
   * Adding this directive one or more times will cause `PollMessagesCount`
   * service to poll for new messages.
   */
  angular
    .module('messages')
    .directive('messagesUnreadCount', messagesUnreadCountDirective);

  /* @ngInject */
  function messagesUnreadCountDirective($interval, MessagesCount, PollMessagesCount, Authentication) {

    var directive = {
      restrict: 'A',
      replace: true,
      scope: true,
      template: '<span class="notification-badge" ng-show="unread > 0" ng-bind="unread"></span>',
      link: link
    };

    return directive;

    function link(scope, elem, attr) {

      var favicon1xElem = angular.element('#favicon'),
          favicon2xElem = angular.element('#favicon2x'),
          faviconPath = '/modules/core/img/';

      scope.unread = PollMessagesCount.getUnreadCount();

      activate();

      /**
       * Initialize checking for unread messages
       */
      function activate() {
        if(!Authentication.user || !Authentication.user.public) {
          // If user wasn't authenticated or public, set up watch
          var activationWatch = scope.$on('userUpdated', function(user) {
            // Did user become public with that update?
            if(Authentication.user.public) {
              // Remove this watch
              activationWatch();
              // Init activation
              activate();
            }
          });

          // Check for unread messages only if user is authenticated + public
          // Otherwise, stop here.
          return;
        }

        // Initialize polling on intervals
        PollMessagesCount.initPolling();

        // Check for unread messages on init
        PollMessagesCount.poll();

        // When we have new messages, act upon them
        var clearUnreadCountUpdated = scope.$on('unreadCountUpdated', onUnreadCountUpdated);

        // Clean out `$on` watcher when directive is removed from DOM
        scope.$on('$destroy', clearUnreadCountUpdated);
      }

      function onUnreadCountUpdated($event, newUnreadCount) {
        scope.unread = newUnreadCount;

        // Change favicon to special notification icon
        if(newUnreadCount > 0) {
          favicon1xElem.attr('href', faviconPath + 'favicon-notification.png');
          favicon2xElem.attr('href', faviconPath + 'favicon-notification@2x.png');
        }
        // Change favicon back to normal
        else {
          favicon1xElem.attr('href', faviconPath + 'favicon.png');
          favicon2xElem.attr('href', faviconPath + 'favicon@2x.png');
        }
      }

    }
  }

})();
