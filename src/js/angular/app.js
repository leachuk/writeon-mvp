'use strict';

var writeOnApp = angular.module('learnerLoggingUi2App', [
  'ngResource',
  'ngRoute'
]);

//run block
writeOnApp.run(function($rootScope, $window) {});

//config block
writeOnApp.config(function ($routeProvider) {
	$routeProvider.when('/',{
		templateUrl: '../../node/view/index.jade',
		controller: 'indexCtrl',
		depth:2
	}),
	$routeProvider.when('../../node/view/admin',{
		templateUrl: 'view/admin.jade',
		controller: 'adminCtrl',
		depth:2
	})
	.otherwise({
        redirectTo: '../../node/view/home',
        templateUrl: 'view/home.jade',
        controller: 'homeCtrl',
        depth:1
     });
});