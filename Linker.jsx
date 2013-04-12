/**
 * ------------------------------------------------------------
 * Copyright (c) 2011 Artem Matevosyan
 * ------------------------------------------------------------
 *
 * @version $Revision: 157 $:
 * @author  $Author: mart $:
 * @date    $Date: 2011-11-07 12:51:41 +0100 (Mo, 07 Nov 2011) $:
 */

#target photoshop

//=============================================================================
// Linker
//=============================================================================


// @include 'include/globals.js'
// @include 'include/stdlib.js'
// @include 'include/config.js'
// @include 'include/div.js'
// @include 'include/log.js'



main();

function main(){

	if ( app.documents.length <= 0 ) {
		if ( DialogModes.NO != app.playbackDisplayDialogs ) {
			alert("Document must be opened");
		}
		return 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
	}

	docRef = app.activeDocument;

	// Enable logging
	Log.enable(docRef);
	Log.notice('Starting Linker');

	// If 'true', then layer.visible will be set to 'false' even if its own visible is true, but the parent layerSet.visible is false
	Stdlib._restoreLayer = false;

	// Check document
	try {
		docPath = docRef.path;
	} catch(e) {
		Log.error("Document must be saved", e, ture);
		return 'cancel';
	}

	// Initialising the settigns
	Log.notice('Initializing configuration');
	documentConfig = config_getCurrentDocConfig(docRef);
	Log.notice('Finished initialising settings');

	// Check configuration
	if (!documentConfig) {
		alert('Configuration was not found');
		Log.error('Configuration was not found');
		return 'cancel';
	}

	// Check links section
	try {
		if (documentConfig.links.length <= 0) throw(new Error());
	} catch(e) {
		alert('Configuration file does not contain \"links\" section');
		Log.error('Configuration file does not contain \"links\" section');
		return 'cancel';
	}

	// Check if we need to traverse at all
	var documentLayers = null;
	for ( var i = 0; i < documentConfig.links.length; i++ ) {
		var link = documentConfig.links[i];
		if ( link.search ) {
			Log.notice('Found a link with "search" parameter. Creating a full list of layers. This might take a while.');
			documentLayers = Stdlib.getLayersList(docRef);
			break;
		}
	}

	// Cycle through the links
	links:
	for ( var i = 0; i < documentConfig.links.length; i++ ) {

		Log.notice('Start processing link #' + i);

		var link = documentConfig.links[i];
		var layerName = link.regexp ? new RegExp(link.layer) : link.layer;

		var container;
		var layers;

		// Getting layers array

		// Search mode
		if (link.search) {

			Log.notice('Searching mode for layer: ' + link.layer);

			if (!documentLayers) {
				Log.warning('Layers list was not created. Hmm, strange...');
				continue;
			}

			// Search for layers and replace them
			layers = Stdlib.getByProperty(Stdlib.getAllByName(documentLayers, layerName), 'kind', LayerKind.SMARTOBJECT, true);

		// Direct location mode
		} else {

			// Get the default container
			container = docRef;

			// Override with specific location
			if (link.location) {
				var sergments = String(link.location).split('/');
				var segment;
				var tmpContainer = docRef;
				while ( segment = sergments.shift() ) {
					segment = segment.trim();
					try {
						var tmpContainer = tmpContainer.layers.getByName(segment);
						Log.notice("Found segment: " + segment);
					} catch(e) {
						Log.warning('Layer location was not found: ' + link.location + '. Segment: ' + segment );
						continue links;
					}
					if ( tmpContainer.typename != "LayerSet" ) {
						Log.warning('Layer path "' + link.layer + '" was found, but it is not a LayerSet. Segment: ' + segment );
						continue links;
					}
				}
				container = tmpContainer;
			}

			// Search for layers and replace them
			Log.notice("Start selecting layers by name and kind");
			layers = [];

			// Optimizing performance
			if ( !link.multipleLayers && !link.regexp ) {
				Log.notice('Select first layer by exact name');
				try {
					layers.push(container.artLayers.getByName(link.layer));
				} catch(e){
					Log.warning( "Layer was not found: " + link.layer );
				}
			} else {
				Log.notice('Select multiple layers');
				var containerDoc = app.documents.add();
				Stdlib.copyLayerToDocument(docRef, container, containerDoc);
				var containerCopy = containerDoc.layers[0];
				var matchFtn = (layerName instanceof RegExp) ?
					function(s) { return s.match(layerName) != null; } :
					function(s) { return s == layerName; };
				for( var c = 0; c < containerCopy.artLayers.length; c++ ){
					if (matchFtn(containerCopy.artLayers[c].name)) {
						layers.push(container.artLayers[c]);
					}
				}
				containerDoc.close(SaveOptions.DONOTSAVECHANGES);
			}

			// layers = Stdlib.getByFunction(container.layers, function(item){
			// 	Log.notice(item.name + ":" + item.typename + ":" + item.kind);
			// 	//if (item)
			// 	//if (item.name != layerName) return false;
			// }, true);
				//Stdlib.getAllByName(container.artLayers, layerName), 'kind', LayerKind.SMARTOBJECT, true);
			Log.notice("End selecting layers");
		}

		// Replace layers
		for (var j = 0; j < layers.length; j++ ) {

			var layer = layers[j];

			// Unlock the contents
			if ( layer.allLocked ) {
				var lockSource = layer;
				while(lockSource.allLocked){
					lockSource.allLocked = false;
					if (lockSource.allLocked) lockSource = lockSource.parent;
				}
			}

			var file = Url.getAbsolute( docPath,  link.path );
			Log.notice('Updating layer "'+ layer.name +'" with file "'+ file +'"');
			Stdlib.replaceSmartLayerContents(docRef, layer, file);

			if (link.processing) {

				Log.notice('Processing SmartObject');
				if (!link.processing.length) continue;

				var smartObjectDoc = Stdlib.editSmartObject(docRef, layer);

				for (var x = 0; x < link.processing.length; x++ ){
					var action = link.processing[x];
					switch(action.type){
						case 'hide':
							setProperty( 'visible', false );
							break;
						case 'show':
							setProperty( 'visible', true );
							break;
						case 'applyLayerComp':
							applyLayerComp(action.layerComp);
							break;
					}
				}

				Log.notice('Save and close SmartObject');
				smartObjectDoc.close(SaveOptions.SAVECHANGES);

				function applyLayerComp( layerComp ){
					Log.notice('Trying to aplly layerComp: ' + layerComp );
					try {
						var comps = smartObjectDoc.layerComps;
						var cpmpsLength = comps.length;
						for ( var i=0; i<cpmpsLength; i++ ){
							var comp = comps[i];
							if (comp.name == layerComp) {
								comp.apply();
								break;
							}
						}
					} catch(e){
						Log.warning("Failed to apply layer comp:" + layerComp, e);
					}
				}

				function setProperty( prop, value ) {
					Log.notice('Setting property "'+prop+'" to "'+value+'"');
					try {
						var layers = [];
						for (var i = 0; i < action.layers.length; i++ ){
							var layerName = action.layers[i];
							layerName = new String(layerName).replace('{filename}', docRef.name);
							layerName = new String(layerName).replace('{documentName}', (docRef.name.substr(0, docRef.name.lastIndexOf('.')) || docRef.name) );
							if (action.regexp) {
								layerName = new RegExp(layerName);
								Log.notice('Looking for layers in SmartObject by RegExp: ' + layerName);
								layers = layers.concat(Stdlib.getAllByName(smartObjectDoc.layers,layerName));
							} else {
								Log.notice('Select first matching layer in SmartObject by exact name: ' + layerName);
								try {
									layers.push(smartObjectDoc.layers.getByName(layerName));
								} catch(e){
									Log.notice('Layer was not found in SmartObject: ' + layerName);
								}
							}
						}
						Log.notice('Found layers:' + layers );
						Stdlib.setPropertyValues( layers, prop, value );
					} catch(e){
						Log.warning("Failed to set execute some actions", e);
					}
				}
			}

			// Restore lock status
			if (lockSource) {
				lockSource.allLocked = true;
			}

		}

		// Log
		layers.length ?
			Log.notice('Link "'+ link.layer +'" was replaced '+ layers.length +' time(s)' ) :
			Log.warning('No layer was replaced for link: ' + link.layer);

	}

	Log.notice('Finished Linker');

	if ( app.playbackDisplayDialogs != DialogModes.NO ) {
		alert('Finished updating links');
	}

	function getLayerByName( container, layerName ){

	}



}




function main_traverseLayers( doc, ftn, recursive ) {

	_traverse(doc, doc.layers, _processLayers, recursive )

	function _traverse(doc, layers, ftn, recursive) {
		for (var i = 1; i <= layers.length; i++) {
			var index = (recursive == true) ? layers.length-i : i - 1;
			var layer = layers[index];
			if (layer.typename == "LayerSet") {
				ftn(doc, layer);
				_traverse(doc, layer.layers, ftn, recursive);
			} else {
				ftn(doc, layer);
			}
		}
	}

	function _processLayers ( doc, layer ) {

		if ( !layer.kind == LayerKind.SMARTOBJECT ) return;
		if ( layer.typename == "LayerSet") return;

		var file = null;

		for ( var i = 0; i < documentConfig.links.length; i++ ) {
			var link = documentConfig.links[i];
			if ( link.layer != layer.name ) continue;
			file = Url.getAbsolute( docPath,  link.path );
		}
		if (file) {
			Stdlib.replaceSmartLayerContents(doc, layer, file);
		}
	}
}