<?

class File extends IO
{
	static $dir = '/home/hole/contents/';
	static $doGroupDirectories = true;
	static $doSortNaturally = true;
	
	static function listing($relativePath = '')
	{
		authorise(UT_MANAGER);
		
		// Establish target directory
		$targetDir = File::$dir;
		if (strpos($relativePath, '../') === false) $targetDir .= $relativePath;
		
		// Scan directory
		$allFiles = scandir($targetDir);
		if (!$allFiles) respond(SERVER_ERROR, "");
		if (File::$doSortNaturally) {
			natcasesort($allFiles);
		}
		
		// Remote dotfiles
		if (!$relativePath) $files = array_diff($allFiles, array('.', '..'));
		else $files = array_diff($allFiles, array('.'));
		
		// Assemble output array of files/folders and their properties
		$dirs = [];
		$docs = [];
		foreach ($files as $fileName) {
			$fileInfo = [
				'name' => $fileName,
				'type' => is_dir($targetDir.$fileName) ? 'd' : 'f',
				'ts' => date("Y-m-d H:i:s", filemtime($targetDir.$fileName)),
				'size' => FileTools::humanFileSize(filesize($targetDir.$fileName), 0)
			];
			if (File::$doGroupDirectories) {
				if ($fileInfo['type'] == 'd') $dirs[] = $fileInfo;
				else $docs[] = $fileInfo;
			} else {
				$docs[] = $fileInfo;
			}
		}
		
		respond(OK, json_encode(array_merge($dirs, $docs)));
	}
	
	static function upload($relativePath = '')
	{
		authorise(UT_MANAGER);
		ini_set('max_execution_time', '0');
		
		if (strpos($relativePath, '../') !== false) {
			respond(BAD_REQUEST, 'Bad file name');
			return;
		}
		
		$bn = basename($_FILES["file"]["name"]);
		move_uploaded_file($_FILES["file"]["tmp_name"], File::$dir.$relativePath.$bn);
		
		respond(OK, json_encode([]));
	}
	
	static function maxUploadSize()
	{
		authorise(UT_MANAGER);
		
		$out = [
			'maxFileSize' => ini_get("upload_max_filesize")
		];
	
		respond(OK, json_encode($out));
	}
	
	static function read($relativePath)
	{
		authorise(UT_MANAGER);
		
		if (!$relativePath || (strpos($relativePath, '../') !== false)) {
			respond(BAD_REQUEST, 'Bad file name');
			return;
		}
		
		$contents = file_get_contents(File::$dir.$relativePath);
		header('Content-Type: text/plain; charset=UTF-8');
		
		if ($contents) respond(OK, $contents);
		else respond(SERVER_ERROR, 'Unable to view raw');
	}
	
	static function rename($oldName, $newName, $relativePath = '')
	{
		authorise(UT_MANAGER);
		
		if (!$oldName || !$newName || (strpos($newName, '/') !== false)) {
			respond(BAD_REQUEST, 'Bad file name');
			return;
		}
		
		$targetDir = File::$dir;
		if (strpos($relativePath, '../') === false) $targetDir .= $relativePath;
		
		$renamed = rename($targetDir.$oldName, $targetDir.$newName);
		
		if ($renamed) respond(OK, json_encode([]));
		else respond(SERVER_ERROR, 'Unable to rename');
	}
	
	static function move($baseName, $toDir, $relativePath = '')
	{
		authorise(UT_MANAGER);
		
		if (!$baseName || (strpos($baseName, '/') !== false) || (strpos($toDir, '/') !== false)) {
			respond(BAD_REQUEST, 'Bad parameters');
			return;
		}
		
		$targetDir = File::$dir;
		if (strpos($relativePath, '../') === false) $targetDir .= $relativePath;
		
		$currentPath = $targetDir.$baseName;
		if ($toDir) {
			$newPath = $targetDir.$toDir.'/'.$baseName;
		} else {
			if (!$relativePath) {
				respond(SERVER_ERROR, 'Cannot move to above managed FS level');
				return;
			}
			$newPath = dirname($targetDir).'/'.$baseName;
		}
		
		$renamed = rename($currentPath, $newPath);
		
		if ($renamed) respond(OK, json_encode([]));
		else respond(SERVER_ERROR, 'Unable to move');
	}
	
	static function remove($baseName, $relativePath = '')
	{
		authorise(UT_MANAGER);
		
		if (!$baseName || (strpos($baseName, '/') !== false)) {
			respond(BAD_REQUEST, 'Bad file name');
			return;
		}
		
		$targetDir = File::$dir;
		if (strpos($relativePath, '../') === false) $targetDir .= $relativePath;
		
		$removed = unlink($targetDir.$baseName);
		
		if ($removed) respond(OK, json_encode([]));
		else respond(SERVER_ERROR, 'Unable to remove');
	}
	
	static function removeDir($baseName, $relativePath = '')
	{
		authorise(UT_MANAGER);
		
		if (!$baseName || (strpos($baseName, '/') !== false)) {
			respond(BAD_REQUEST, 'Bad directory name');
			return;
		}
		
		$targetDir = File::$dir;
		if (strpos($relativePath, '../') === false) $targetDir .= $relativePath;
		
		$removed = FileTools::rrmdir($targetDir.$baseName);
		
		if ($removed) respond(OK, json_encode([]));
		else respond(SERVER_ERROR, 'Unable to remove');
	}
}

class FileTools
{
	static function humanFileSize($bytes, $decimals = 2)
	{
		$sz = 'BKMGTP';
		$factor = floor((strlen($bytes) - 1) / 3);
		return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
	}
	
	static function rrmdir($dir)
	{ 
		$removed = false;
		
		if (is_dir($dir)) { 
			$objects = scandir($dir);
			foreach ($objects as $object) { 
				if ($object != "." && $object != "..") { 
					if (is_dir($dir. DIRECTORY_SEPARATOR .$object) && !is_link($dir."/".$object))
						FileTools::rrmdir($dir. DIRECTORY_SEPARATOR .$object);
					else
						unlink($dir. DIRECTORY_SEPARATOR .$object); 
				} 
			}
			$removed = rmdir($dir); 
		}
		
		return $removed;
	}
}

?>