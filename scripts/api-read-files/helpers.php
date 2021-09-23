<?php

/**
 * Read all files in the given directory. The directory is relative to this PHP script.
 */
function readAllFilesInDirectory($dir)
{
  $dirIterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
  $filesArray = array();

  foreach ($dirIterator as $path) {
    if (!$path->isDir()) {
      $filesArray[] = str_replace('\\', '/', $path->getPathname());
    }
  }

  return $filesArray;
}
