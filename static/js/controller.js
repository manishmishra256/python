angular.module('loginApp', [])
	   .controller('LoginController', ['$scope', function($scope){

				var loginProvider = this;

				loginProvider.submit = function(user){

					console.log(user);
				};

				$scope.user = {name:'', email:'', password:'', password_verify:''}

				$scope.resetCopy = angular.copy($scope.user);

				$scope.reset = function(){

					var me = this;
					me.user = angular.copy(me.resetCopy);
					me.loginForm.$setPristine()
					me.loginForm.$setValidity();
					me.loginForm.$setUntouched();
				};

	   }])
	   .directive('passwordVerify', function(){

				return {

					require:'ngModel',
					scope:{
						passwordVerify:'='
					},
					link:function(scope, element, attrs, ctrl){

						scope.$watch(function(){

							var combined;
							if(scope.passwordVerify || ctrl.$viewValue){
								combined = scope.passwordVerify + '_' + ctrl.$viewValue;
							}
							return combined;
						}, function(value){

							if(value){

								ctrl.$parsers.unshift(function(viewValue){

									var origin = scope.passwordVerify;
									if(origin!==viewValue){
										ctrl.$setValidity('passwordVerify', false);
										return undefined;
									}
									else{
										ctrl.$setValidity('passwordVerify', true);
										return viewValue;
									}
								});	
							}
						})
					}
				}
});
