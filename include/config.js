/**
 * ------------------------------------------------------------
 * Copyright (c) 2011 Artem Matevosyan
 * ------------------------------------------------------------
 *
 * @version $Revision: 199 $:
 * @author  $Author: mart $:
 * @date    $Date: 2012-05-03 11:12:29 +0200 (Do, 03 Mai 2012) $:
 */


//=============================================================================
// Config
//=============================================================================


function config_getCurrentDocConfig(doc){

	var documentConfig = null;

	try {

		// Only for saved documents
		if (!doc.path) return;
		var documentLocation = Url.getAbsolute(doc.path);

		// 1. Look in the folder near the document
		configFilePath = documentLocation + '/Project.conf';
		if (!File(configFilePath).exists) configFilePath = '';

		// 2. Look in home directory
		if (!configFilePath) {

			var projectName;
			var projectConfig;

			var userConfigurationFolder	= HOME;
			var userProjectsFolder		= userConfigurationFolder + '/Projects';
			var projectsIndexFile		= userConfigurationFolder + '/Projects.conf';

			Log.notice('Looking for projects index: ' + projectsIndexFile );

			// If not there, will throw error and return
			var projectsIndexJSON = Stdlib.readFromFile(projectsIndexFile);
			var projectsIndex = eval(projectsIndexJSON);

			Log.notice('Found projects index. Looking for location: ' + documentLocation);

			outer:
			for ( var i =0; i < projectsIndex.length; i++ ) {

				var locations = projectsIndex[i].locations;
				if ( !is_array(locations) ) continue;

				inner:
				for (var j = 0; j < locations.length; j++ ) {
					if (String(Url.getAbsolute(locations[j])).toLowerCase() == String(documentLocation).toLowerCase()) {
						projectName = projectsIndex[i].project;
						projectConfig = projectsIndex[i].config;
						break outer;
					}
				} // inner

			} // outer

			if (!projectName) {
				Log.notice("Location wasn't found in projects index");
				return;
			}

			Log.notice("Using project: " + projectName);

			configFilePath = projectConfig ? projectConfig : projectName + '.conf'
			configFilePath = Url.getAbsolute(userProjectsFolder, configFilePath);

			if (!File(configFilePath).exists) {
				Log.notice("Could not find the project configuration file: " + configFilePath);
				return;
			}

		}

		Log.notice("Using configuration file: " + configFilePath);
		var configJSON = Stdlib.readFromFile( configFilePath );

		var documents = eval(configJSON);
		if (!is_array(documents)) throw(Error('Configuration should contain JSON array of documents'))

		var defaultDocumentConfig = Stdlib.getByFunction(documents, function(d){ return (!d.filename || d.filename=='default') ? true : false; });
		var documentConfig = Stdlib.getByProperty(documents, "filename", doc.name);

		if (!documentConfig) documentConfig = defaultDocumentConfig;

		extend:
		while ( documentConfig.extend ) {

			var extend = documentConfig.extend;
			delete documentConfig.extend;

			if (is_array(extend)) {

				for (var i = 0; i < extend.length; i++ ){
					var targetDocumentFilename = extend[i];
					var targetDocumentConfig = targetDocumentFilename == 'default' ? defaultDocumentConfig : Stdlib.getByProperty(documents, "filename", targetDocumentFilename);
					if (!targetDocumentConfig) break extend;
					documentConfig = MergeObjectsRecursive(targetDocumentConfig, documentConfig);
				}
			} else {
				var targetDocumentFilename = extend;
				var targetDocumentConfig = targetDocumentFilename == 'default' ? defaultDocumentConfig : Stdlib.getByProperty(documents, "filename", targetDocumentFilename);
				if (!targetDocumentConfig) break extend;
				documentConfig = MergeObjectsRecursive(targetDocumentConfig, documentConfig);
			}

		}

		Log.notice("Configuration source: " + documentConfig.toSource());

	} catch(e){
		alert(e);
		Log.warning("Could not get configuration", e);
		return;
	}

	if ( documentConfig ) {
		Log.notice("Successfully got configuration" );
	} else {
		Log.notice('Configuration for document "'+ doc.name +'"" was not found' );
	}

	return documentConfig;

}
