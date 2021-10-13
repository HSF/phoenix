<?php

include_once('./helpers.php');

// Do not report errors (comment for development).
error_reporting(E_ERROR | E_PARSE);

// Associative array/dictionary for configuration.
// Change this to directories from where you want to read the event data and config files.
$config = array(
  'event_data' => '../data/event_data/',
  'config' => '../data/config/'
);

// Set the configured directory to read for either event data or config.
$directoryToRead = 'event_data';

// Check if the type of data requested is config and set the the directory to read.
if (isset($_GET['type']) && $_GET['type'] == 'config') {
  $directoryToRead = 'config';
}

// If the `f` query param is set then read the file specified through the param.
if (isset($_GET['f'])) {
  echo file_get_contents($config[$directoryToRead] . $_GET['f']);
  return;
}

// Return a 422 response code if the configured directory is not found.
if (!is_dir($config[$directoryToRead])) {
  http_response_code(422);
  echo "The configured directory does not exist.";
  return;
}

// Read all the files in the configured directory.
$allFiles = readAllFilesInDirectory($config[$directoryToRead]);

// Prepare the response and remove `./data` at the start of files paths.
$response = array_map(
  function ($file) use ($config, $directoryToRead) {
    return substr($file, strlen($config[$directoryToRead]));
  },
  $allFiles
);

// Send the response.
echo json_encode($response);
