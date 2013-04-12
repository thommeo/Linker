/**
 * ------------------------------------------------------------
 * Copyright (c) 2011 Artem Matevosyan
 * ------------------------------------------------------------
 *
 * @version $Revision: 137 $
 * @author  $Author: mart $
 * @date    $Date: 2011-10-31 00:24:07 +0100 (Mon, 31 Oct 2011) $
 */


//=============================================================================
// Globals
//=============================================================================

// Constants
var SMARTSETCOLOR 		= "violet";
var DISABLEDSETCOLOR 		= "gray";
var BACKGROUNDLAYERSETNAME	= "Background";
var HOME			= '~/Pro Actions';

// Logging
var LOG_FILE			= HOME + '/Linker/Logs/{document}_%Y-%m-%d_%H-%M-%S.log' // {document}, {loglevel}, +strftime
var LOG_APPEND			= false;
var LOG_LEVEL			= 3; // 3 Notice, 2 Warning, 1 Critical error, 0 Nothing

// Gloabal Variables
var documentConfig		= null;
var docRef			= null;
var docPath			= null;