<?php

/**
 * Read all files in the given directory. The directory is relative to this PHP script.
 */
function readAllFilesInDirectory($dir)
{
  $dirIterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
  $filesArray = array();

  foreach ($dirIterator as $path) {
    if ($path->isFile()) {
      $filesArray[] = $path->getPathname();
    }
  }

  return $filesArray;
}
