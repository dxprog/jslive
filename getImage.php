<?php

$file = $_GET['file'];
$out = new stdClass();

if (file_exists('KANON_SE/images/' . $file . '.png')) {
	
	$out->img = 'data:image/png;base64,' . base64_encode(file_get_contents('KANON_SE/images/' . $file . '.png'));
	if (file_exists('KANON_SE/images/' . $file . '.xml')) {
		$out->regions = array();
		$xml = simplexml_load_file('KANON_SE/images/' . $file . '.xml');
		foreach($xml->regions->region as $region) {
			$obj = new stdClass();
			$obj->x1 = (int)$region->attributes()->x1;
			$obj->x2 = (int)$region->attributes()->x2;
			$obj->y1 = (int)$region->attributes()->y1;
			$obj->y2 = (int)$region->attributes()->y2;
			$out->regions[] = $obj;
		}
	}
	
}

echo json_encode($out);