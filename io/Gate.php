<?

class Gate extends IO
{
	static $maxLoginAttempts = 5;
	
	static function sessionInfo($z1 = 'yes', $z2 = 'no')
	{
		$out = [
			'isLoggedIn' => isset($_SESSION['person_id']),
			'whoa1' => $z1,
			'whoa2' => $z2
		];
		respond(OK, json_encode($out));
	}
	
	static function login()
	{
		authorise(UT_GUEST);
		
		$loginAttempts = 0;
		$loginAttemptsFile = 'loginAttempts.txt';
		if (file_exists($loginAttemptsFile)) $loginAttempts = (int)(file_get_contents($loginAttemptsFile));
		if ($loginAttempts >= Gate::$maxLoginAttempts) {
			respond(BAD_REQUEST, "Locked out due to too many login attempts.");
			return;
		}
		
		if (isset($_POST['username']) && isset($_POST['password'])) {
			if (md5($_POST['password']) == "008c5926ca861023c1d2a36653fd88e2") {
				file_put_contents($loginAttemptsFile, "0");
				$_SESSION['ut'] = UT_MANAGER;
				$_SESSION['person_id'] = 1;
				$_SESSION['person_name'] = 'File Mon';
				self::info();
			} else {
				$loginAttempts++;
				file_put_contents($loginAttemptsFile, (string)$loginAttempts);
				respond(BAD_REQUEST, "Please check your credentials. " . (string)$loginAttempts . '/' . (string)Gate::$maxLoginAttempts . ' login attempts.');
			}
		}
	}
	
	static function info()
	{
		//if (isset($_SESSION['agency_id'])) 
			respond(OK, json_encode($_SESSION));
	}
	
	static function logout()
	{
		foreach ($_SESSION as $key=>$value) {
			unset($_SESSION[$key]);
		}
		
		$info = [
			'msg' => 'Successfully logged out.'
		];
		
		respond(OK, json_encode($info));
	}
	
	static function test()
	{
		respond(OK, json_encode($_SERVER));
	}
	
	static function phpinfo()
	{
		phpinfo();
	}
}

?>