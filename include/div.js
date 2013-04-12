/**
 * ------------------------------------------------------------
 * Copyright (c) 2011 Artem Matevosyan
 * ------------------------------------------------------------
 *
 * @version $Revision: 142 $:
 * @author  $Author: mart $:
 * @date    $Date: 2011-11-01 01:05:50 +0100 (вт, 01 ноя 2011) $:
 */

//=============================================================================
// Div
//=============================================================================


function is_array(input){
	return typeof(input)=='object'&&(input instanceof Array);
}

function MergeObjectsRecursive(obj1, obj2) {
	//alert("Received:\n\n" +obj1+"\n\n"+ obj2);
	for (var p in obj2) {
		try {
			// Property in destination object set. Update its value.
			if ( obj2[p].constructor == Object || obj2[p].constructor == Array ) {
				obj1[p] = MergeObjectsRecursive(obj1[p], obj2[p]);
			} else {
				obj1[p] = obj2[p];
			}
		} catch(e) {
			//Log.error("Error", e);
			// Property in destination object not set; create it and set its value.
			obj1[p] = obj2[p];
		}
	}
	//alert("Return:\n\n" +obj1+"\n\n"+ obj2);
	// I could'nt figure out this bug. For some reason it returns 'undefined' if obj2 has a property
	// Obejct{} (empty object) and obj1 has not this property at all. Or similar situation.	This helps for some reason...
	if (obj1.toSource) obj1.toSource();
	return obj1;
}

var Url = {

	getAbsolute: function( basePath, targetPath ){

		if ( !basePath ) throw(new Error('Url.getAbsolute: Invalid input'));
		basePath = new String(basePath);

		if (!targetPath) targetPath = '';
		targetPath = new String(targetPath);

		basePath = basePath.replace(/^\//, '/');
		targetPath = targetPath.replace(/^\//, '/');

		// c:/path and ~/path are already absolute
		var isAbsolute = (/^(~|\/|[a-z]:)/i.test(targetPath)) ? true : false;
		basePath = isAbsolute ? targetPath : basePath + '/' + targetPath;

		return Folder(basePath).fullName;
	},

}