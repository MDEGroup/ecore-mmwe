/**
 * Created by nicolasacco on 06/10/16.
 */
(function () {
	'use strict';

	angular
		.module('modelsEditor')
		.directive('ecoreInstancePropertiesEditor', ecoreInstancePropertiesEditor);

	/* @ngInject */
	function ecoreInstancePropertiesEditor(MODELS_EDITOR) {
		var directive = {
			bindToController: true,
			controller: TreeEcorePropertiesEditorController,
			controllerAs: 'ctrl',
			templateUrl: MODELS_EDITOR.BASE_PATH + '/propertiesEditor/propertiesEditor.html',
			restrict: 'EA',
			scope: {
				rootEcoreElement: '=',
				ecoreElement: '='
			}
		};
		return directive;


	} // fine direttiva

	/* @ngInject */
	function TreeEcorePropertiesEditorController($scope, EcoreDecoratorsRepoService, ECORE_DECORATOR) {

		var self = this;

		self.values = {};

		// metodi
		self.init = init;


		init();

		// =============================================

		function init() {

		}

		$scope.$watch('ctrl.ecoreElement', function () {
			if (angular.isDefined(self.ecoreElement)) {
				self.attributes = self.ecoreElement.eClass.get('eAllAttributes').map(function (c) {
					var attr = c.values;
					if (angular.isDefined(attr.eType) && attr.eType != null)
						attr.type = attr.eType.values.name;
					return attr;
				});
			}
		});

	} // fine controller

})();

