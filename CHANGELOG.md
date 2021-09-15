# Change Log

All notable changes will be documented in this file.

## 1.3.0 - 2021-09-14

* Added support for `thumbnail` action, which works similar to `marquee` and `video` actions, but with the added ability to generate the thumbnail images from an existing asset image type and scale it down into thumbnail size.

## 1.2.0 - 2021-09-05

* Added `collection` action which generates EmulationStation `.cfg` collection files, with support for filters.
* Added `marquee` action which adds or removes `<marquee>` image metadata.
* Updated `copy` action to support `--no-marquee` option.
* Updated `copy` and `convert` action to support filters.
* Renamed `remove-video` action to `video` and now supports both adding or removing `<video>` metadata.
* Added several example "Top 35" filters to `./filters` of this repository.

## 1.1.0 - 2021-08-02

* Added `backup` action.
* Added linting GitHub Action.
* Improved documentation.

## 1.0.0 - 2021-08-01

* Initial release.
