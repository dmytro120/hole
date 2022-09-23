<?

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('html_errors', 0);
error_reporting(E_ALL);

define('OK',			200);
define('BAD_REQUEST',	400);
define('UNAUTHORIZED',	401);
define('SERVER_ERROR',	500);

define('UT_GUEST',		0x01);
define('UT_TENANT',		0x02);
define('UT_OWNER',		0x04);
define('UT_VENDOR',		0x08);
define('UT_MANAGER',	0x10);
define('UT_OVERLORD',	0x20);
define('UT_ALL', 		0x3F);

session_start();
if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > 3600)) {
    // last request was more than 30 minutes ago
    session_unset();
    session_destroy();
}
$_SESSION['LAST_ACTIVITY'] = time(); // update last activity time stamp

setcookie(session_name(),session_id(), [
	'expires' => time()+3600,
	'secure' => true,
	'SameSite' => 'None'
]);
//header("Access-Control-Allow-Origin: null");
header('Access-Control-Allow-Credentials: true');

class IO
{
	static $db;
}
date_default_timezone_set('America/New_York');

function authorise($access=UT_GUEST) {
	$ut = isset($_SESSION['ut']) ? $_SESSION['ut'] : UT_GUEST;
	if (!($ut & $access)) respond(UNAUTHORIZED);
}

function respond($status, $output="") {
	if ($status != OK) http_response_code($status);
	exit((string)$output);
}

set_error_handler(function ($error_type, $error) {
	if ($error_type == E_ERROR) http_response_code(SERVER_ERROR);
	return false;
});

function urlFriendlyNameFromName($str, $replace=array(), $delimiter='-') {
	if( !empty($replace) ) {
		$str = str_replace((array)$replace, ' ', $str);
	}

	$clean = iconv('UTF-8', 'ASCII//TRANSLIT', $str);
	$clean = preg_replace("/[^a-zA-Z0-9\/_|+ -]/", '', $clean);
	$clean = strtolower(trim($clean, '-'));
	$clean = preg_replace("/[\/_|+ -]+/", $delimiter, $clean);

	return $clean;
}

include "Gate.php";
include "File.php";

if (isset($_GET['c'], $_GET['m']) && class_exists($_GET['c']) && get_parent_class($_GET['c']) == "IO") call_user_func_array($_GET['c'].'::'.$_GET['m'], isset($_GET['p']) ? $_GET['p'] : array());