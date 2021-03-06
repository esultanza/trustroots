(function() {
  'use strict';

  angular
    .module('users')
    .controller('ProfileEditAccountController', ProfileEditAccountController);

  /* @ngInject */
  function ProfileEditAccountController($http, $state, $window, Users, Authentication, messageCenterService) {

    // ViewModel
    var vm = this;

    // Exposed
    vm.updateUserEmail = updateUserEmail;
    vm.resendUserEmailConfirm = resendUserEmailConfirm;
    vm.updateUserSubscriptions = updateUserSubscriptions;
    vm.updatingUserSubscriptions = false;
    vm.changeUserPassword = changeUserPassword;
    vm.removalConfirm = false;
    vm.user = Authentication.user;

    // Related to password reset
    vm.changeUserPasswordLoading = false;
    vm.currentPassword = '';
    vm.newPassword = '';
    vm.verifyPassword = '';

    /**
     * Change user email
     */
    function updateUserEmail() {
      vm.emailSuccess = vm.emailError = null;
      var user = new Users(Authentication.user);

      user.$update(function(response) {
        messageCenterService.add('success', 'Check your email for further instructions.');
        vm.emailSuccess = 'We sent you an email to ' + response.emailTemporary + ' with further instructions. ' +
                          'Email change will not be active until that. ' +
                          'If you don\'t see this email in your inbox within 15 minutes, look for it in your junk mail folder. If you find it there, please mark it as "Not Junk".';
        vm.user = Authentication.user = response;
      }, function(response) {
        vm.emailError = response.data.message || 'Something went wrong.';
      });
    }

    /**
     * Resend confirmation email for already sent email
     */
    function resendUserEmailConfirm($event) {
      if($event) $event.preventDefault();
      if(vm.user.emailTemporary) {
        vm.user.email = vm.user.emailTemporary;
        updateUserEmail();
      }
    }

    /**
     * Change user email subscriptions
     */
    function updateUserSubscriptions() {
      vm.updatingUserSubscriptions = true;
      var user = new Users(Authentication.user);
      user.$update(function(response) {
        messageCenterService.add('success', 'Subscriptions updated.');
        vm.user = Authentication.user = response;
        vm.updatingUserSubscriptions = false;
      }, function(response) {
        vm.updatingUserSubscriptions = false;
        messageCenterService.add('error', 'Error: ' + response.data.message);
      });
    }

    /**
     * Change user password
     */
    function changeUserPassword() {

      vm.changeUserPasswordLoading = true;

      $http.post('/api/users/password', {
        currentPassword: vm.currentPassword,
        newPassword: vm.newPassword,
        verifyPassword: vm.verifyPassword
      }).success(function(response) {
        vm.currentPassword = '';
        vm.newPassword = '';
        vm.verifyPassword = '';
        angular.element('#newPassword').val(''); //Fix to bypass password verification directive
        vm.changeUserPasswordLoading = false;
        vm.user = Authentication.user = response.user;
        messageCenterService.add('success', 'Your password is now changed. Have a nice day!');
      }).error(function(response) {
        vm.changeUserPasswordLoading = false;
        messageCenterService.add('danger', ((response.message && response.message !== '') ? response.message : 'Password not changed due error, try again.'), { timeout: 10000 });
      });

    }

  }

})();
