<?php

/* KRPL interpreter */
function interpretToJson($in, $out) {
	
	$file = file($in);
	$actions = array();
	$lnCount = 0;
	for ($j = 0, $c = count($file); $j < $c; $j++) {
		
		$line = trim($file[$j]);
		$obj = null;
		
		if (strlen($line) > 0 && $line{0} != '#' && $line{0} != '{') {
			$obj = new stdClass();
			$obj->code = $line;
			if ($line{0} == '@') {
				$obj->label = str_replace('@', '', $line);
				$obj->code = '';
			}
		}
		
		/* if (strlen($line) > 0) {
			$words = explode(' ', $line);
			$obj = new stdClass();
			
			// Check for variable assignment
			if (count($words) > 1) {
				switch ($words[1]) {
					case '=':
						$obj->action = 'assign';
						$obj->name = $words[0];
						$obj->value = str_replace($obj->name . ' = ', '', $line);
						$obj->operation = '=';
						break;
					case '*=':
						$obj->action = 'assign';
						$obj->name = $words[0];
						$obj->value = str_replace($obj->name . ' *= ', '', $line);
						$obj->operation = '*=';
						break;
					case '+=':
						$obj->action = 'assign';
						$obj->name = $words[0];
						$obj->value = str_replace($obj->name . ' += ', '', $line);
						$obj->operation = '+=';
						break;
					default:
						if ($line{0} == '#' || $line{0} == '{') {
							$obj = null;
						} else {
							$obj->action = 'function';
							$obj->name = $words[0];
							if (preg_match('/\((.*?)\)/', $line, $p)) {
								$params = explode(',', $p[1]);
								for ($i = 0, $count = count($params); $i < $count; $i++) {
									$params[$i] = trim($params[$i]);
								}
								$obj->params = $params;
								$obj->extra = str_replace($obj->name . ' ' . $p[0] . ' ', '', $line);
							} else {
								$obj->params = str_replace($obj->name . ' ', '', $line);
							}
						}
						break;
				}
			} else {
				if ($line{0} == '@') {
					$obj->action = 'label';
					$obj->name = str_replace('@', '', trim($words[0]));
				} else if ($line{0} == '#' || $line{0} == '{') {
					$obj = null;
				} else {
					$obj->action = 'function';
					$obj->name = $line;
				}
			}
		} */
		
		if (null !== $obj) {
			$lnCount++;
			$obj->ln = $j;
			$actions[] = $obj;
		}
		
	}
	
	$out = new stdClass();
	$out->code = $actions;
	$out->scene = $_GET['id'];
	
	return json_encode($out);
	
}

$id = $_GET['id'];
while (strlen($id) < 4) {
	$id = '0' . $id;
}

echo interpretToJson('./KANON_SE/scenario/SEEN' . $id . '.ke', '');