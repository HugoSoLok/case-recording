# Spec Delta

## Purpose

Turns the user's Chinese key points into an editable English case record draft that follows the user's template and rules and stays consistent with the same case's past records.

## ADDED Requirements

### Requirement: Draft from Chinese key points
The system SHALL produce an English draft record from Chinese key points entered by the user for a selected case.

#### Scenario: Successful draft
- **WHEN** the user selects a case, enters key points, and requests a draft while connected and with a template
- **THEN** the app shows an English draft structured by the template

#### Scenario: Empty key points
- **WHEN** the user requests a draft with empty key points
- **THEN** the app does not contact OpenRouter and asks for key points

### Requirement: Apply template and rules
The system SHALL instruct the model to follow the active template's structure and the active rules.

#### Scenario: Template structure followed
- **WHEN** a draft is produced
- **THEN** its sections follow the headings and order defined in the template

### Requirement: Use past records of the same case
The system SHALL include the selected case's saved records as context, and MUST NOT include records of other cases.

#### Scenario: Context from same case only
- **WHEN** the user drafts for case A
- **THEN** only case A's saved records are sent as context

#### Scenario: First record in a case
- **WHEN** the selected case has no saved records
- **THEN** the draft is produced from the key points, template and rules alone

### Requirement: Do not invent facts
The system SHALL instruct the model to base facts on the key points and past records only, and to mark template sections it cannot fill with a visible "[TBC]" marker.

#### Scenario: Missing information
- **WHEN** the key points give no information for a template section
- **THEN** that section is marked "[TBC]" and not filled with invented content

### Requirement: Editable draft, explicit save
The system SHALL present the draft as editable text and MUST NOT save it as a record until the user chooses to save.

#### Scenario: Discard draft
- **WHEN** the user closes the draft without saving
- **THEN** no record is added to the case

#### Scenario: Regenerate
- **WHEN** the user requests a new draft for the same key points
- **THEN** the new draft replaces the shown one without altering saved records

### Requirement: Warn on likely personal data
The system SHALL warn the user before sending when the key points or draft context appear to contain personal identifiers such as phone numbers, ID numbers or email addresses, and let the user cancel or proceed.

#### Scenario: Identifier detected
- **WHEN** the key points contain a phone number or email address and the user requests a draft
- **THEN** the app shows a warning naming the kind of identifier and sends nothing until the user confirms

#### Scenario: No identifier detected
- **WHEN** no likely identifier is found
- **THEN** the request is sent without a warning
