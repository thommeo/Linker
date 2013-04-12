var Log = {};

Log.doc		= null;
Log.logFile	= null;
Log.logLevel	= null;

Log.notice = function (msg, e) {
	this._log(msg, e);
}

Log.warning = function (msg, e) {
	if (this.logLevel < 2) return;
	msg = "[WARNING] " + ( msg ? msg : '' )
	e ? Stdlib.logException(e, msg) : Stdlib.log(msg);
}

Log.error = function (msg, e, doAlert) {
	if (this.logLevel < 1) return;
	msg = "[ERROR] " + ( msg ? msg : '' );
	e ? Stdlib.logException(e, msg, doAlert) : Stdlib.log(msg);;
}

Log.enable = function( docRef ) {

	this.doc = docRef;
	this.logFile = LOG_FILE;
	this.logLevel = LOG_LEVEL;

	if (!this.logFile) return;
	this.logFile = this.logFile.replace('{document}', this.doc.name);
	this.logFile = this.logFile.replace('{loglevel}', this.logLevel);
	this.logFile = new Date().strftime(this.logFile);
	Stdlib.log.enabled = true;
	Stdlib.log.append = LOG_APPEND;
	Stdlib.log.setFile(this.logFile);
}

Log._log = function (msg, e) {
	if (this.logLevel < 3) return;
	msg = "[NOTICE] " + ( msg ? msg : '' );
	e ? Stdlib.logException(e, msg) : Stdlib.log(msg);
}
