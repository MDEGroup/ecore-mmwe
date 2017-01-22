/**
 * Created by Nicola Sacco on 06/01/2017.
 */
(function () {
	'use strict';

	angular
		.module('modelsEditor')
		.controller('ModelsEditorController', ModelsEditorController);


	/* @ngInject */
	function ModelsEditorController($stateParams,
									$state,
									modelsService,
									metaModelsService,
									$mdToast,
									MODELS,
									EcoreDecoratorsRepoService,
									ECORE_DECORATOR) {
		var self = this;

		/**
		 * Attributes
		 */
		self.rootElement = undefined;
		self.metaModel = undefined;
		self.metaModelMetaData = undefined;
		self.metaModelRootPackage = undefined;
		self.loading = true;

		/**
		 * Public Methods
		 */
		self.onRootElementSelected = __onRootElementSelected;
		self.export = _export;

		init();

		function init() {
			/**
			 * Clear previously registered classes from other MetaModels
			 *
			 * OBS: This is similar to the registration of the metamodel in the eclipse workspace, it could be fixed by adding the uri to elements registration,
			 * sadly in many stored models the uri is not registered.
			 *
			 * By the way it is cleared at every page refresh.
			 *
			 * Todo: Fix by adding Complete Uri in registration of elements.
			 */
			EcoreDecoratorsRepoService.clearElements();

			if ($stateParams.metaModelId != null) {
				/**
				 * At least a metaModelId param has to be passed to URL in order to start editing a model
				 * @type {*|null}
				 */
				self.metaModelId = $stateParams.metaModelId;
				__loadMetaModel();
			} else {
				/**
				 * If no metaModelId is passed return to metaModelSelector and show the error to the user.
				 */
				$mdToast.show(
					$mdToast.simple()
						.textContent('No meta model selected.')
				);
				$state.go(MODELS.ROUTES.metaModelSelector)
			}
		}

		function __loadMetaModel() {
			/**
			 * Notify the downloading of the MetaModel
			 */
			$mdToast.show(
				$mdToast.simple()
					.textContent('Downloading MetaModel')
					.hideDelay(3000)
			);

			var resourceSet = Ecore.ResourceSet.create();

			/**
			 * Start the loading of the MetaModelMetaData
			 */
			metaModelsService.loadById(self.metaModelId)
				.then(function (metaModelMetaData) {
					/**
					 * Start the loading of MetaModel File
					 */
					metaModelsService.loadFile(self.metaModelId)
						.then(function (metaModel) {
							try {

								/**
								 * Define an onload function ( closure variables needed )
								 * @param model
								 */
								var initModel = function (model) {
									var contents = model.get('contents');

									self.metaModelMetaData = metaModelMetaData;

									self.metaModelRootPackages = model.get('contents').map(function (c) {
										return c;
									});
									self.metaModel = model;
									__onMetaModelLoaded();
								}


								try {
									/**
									 * If an URI is defined in metadata use it
									 */
									self.resource = resourceSet.create({uri: metaModelMetaData.uri[0]});
								} catch (e) {
									/**
									 * If it fails use the name of MetaModel
									 */
									self.resource = resourceSet.create({uri: encodeURI(metaModelMetaData.name)});
								}
								/**
								 * Start the decoding of the received file ( see EcoreJS implementation)
								 */
								self.resource.load(metaModel, initModel);

								self.modelIsSupported = true;
							} catch (e) {
								self.modelIsSupported = false;
							}
						})
				})
		}

		function __onMetaModelLoaded() {


			angular.forEach(self.metaModelRootPackages, function (item) {
				EcoreDecoratorsRepoService
					.getDecorator(ECORE_DECORATOR.TREE_DECORATORS_PREFIX + item.eClass.values.name)
					.decorate(item);
			})
			self.loading = false;
		}

		function __onRootElementSelected(element) {
			$mdToast.show(
				$mdToast.simple()
					.textContent(element.values.name + ' selected as root element')
					.hideDelay(3000)
			);
			self.rootElement = element.create();
			self.selectedElement = self.rootElement;
		}

		function getPlainModel(element) {
			if (element != null) {
				var plainElement = {}

				var attributes = element.eClass.get('eAllAttributes').map(function (c) {
					var attr = c.values;
					if (angular.isDefined(attr.eType) && attr.eType != null)
						attr.type = attr.eType.values.name;
					return attr;
				});

				angular.forEach(attributes, function (item) {
					plainElement[item.name] = element.values[item.name]
				});

				var references = element.eClass.get('eReferences').map(function (c) {
					return c;
				});

				angular.forEach(references, function (item) {

					if (item.values.upperBound == 1) {
						plainElement[item.values.name] = getPlainModel(element.values[item.values.name])
					} else {
						plainElement[item.values.name] = element.values[item.values.name].map(function (c) {
							return getPlainModel(c);
						})
					}

				});

				return plainElement;
			}
			else {
				return null;
			}

		}

		function _export() {

			var element = document.createElement('a');

			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(getPlainModel(self.rootElement), null, '  ')));

			element.setAttribute('download', 'export.json');

			element.style.display = 'none';

			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		}


	}

})();

