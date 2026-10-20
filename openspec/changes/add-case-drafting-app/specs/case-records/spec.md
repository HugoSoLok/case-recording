# Spec Delta

## Purpose

Keeps cases and their saved English records on the user's device so earlier records can be reviewed, edited, reused as drafting context, and backed up.

## ADDED Requirements

### Requirement: Manage cases
The system SHALL let the user create, rename and delete cases, and list existing cases.

#### Scenario: Create a case
- **WHEN** the user creates a case with a non-empty name
- **THEN** the case appears in the case list with no records

#### Scenario: Delete requires confirmation
- **WHEN** the user deletes a case
- **THEN** the app asks for confirmation and, only if confirmed, removes the case and all its records

### Requirement: Save records within a case
The system SHALL let the user save a record (final English text, with the Chinese key points it came from and a date) under a case.

#### Scenario: Save a record
- **WHEN** the user saves an edited draft in a case
- **THEN** a new record is added to that case with the saved text, the source key points, and the save date

### Requirement: View and edit past records
The system SHALL list a case's records in date order and let the user open and edit any of them.

#### Scenario: Edit a past record
- **WHEN** the user edits and saves an existing record
- **THEN** the updated text replaces the old text and is used as context for later drafts

### Requirement: Local-only storage
The system MUST keep all cases and records in the user's browser on that device and MUST NOT send them anywhere except as drafting context in a request the user initiates.

#### Scenario: Records survive reload
- **WHEN** the user reloads the app or reopens the browser
- **THEN** the cases and records are still present

#### Scenario: No cross-device sync
- **WHEN** the user opens the app on another device
- **THEN** that device has only the data created or imported on it

### Requirement: Export and import
The system SHALL let the user export all cases, records, template and rules to a file and import such a file.

#### Scenario: Export
- **WHEN** the user chooses export
- **THEN** a file containing all cases, records, template and rules is downloaded

#### Scenario: Import into a populated app
- **WHEN** the user imports an export file while data exists
- **THEN** the app asks whether to replace or merge, and makes no change until the user chooses

#### Scenario: Invalid import file
- **WHEN** the user imports a file that is not a valid export
- **THEN** the app shows an error and leaves existing data unchanged
