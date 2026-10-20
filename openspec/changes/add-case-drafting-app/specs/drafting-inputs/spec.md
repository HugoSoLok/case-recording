# Spec Delta

## Purpose

Lets the user supply and maintain the template file and the rules/behaviour file that control the structure and wording of every drafted record.

## ADDED Requirements

### Requirement: Supply a template file
The system SHALL let the user provide a template as a text or markdown file, by upload or paste, and SHALL store it in the browser for reuse.

#### Scenario: Upload a template
- **WHEN** the user uploads a template file
- **THEN** the app stores it and shows its content as the active template

#### Scenario: Replace the template
- **WHEN** the user provides a new template
- **THEN** the new template becomes active and applies to later drafts only

### Requirement: Supply a rules file
The system SHALL let the user provide, edit and store a rules/behaviour file as text or markdown, separate from the template.

#### Scenario: Rules apply across templates
- **WHEN** the user replaces the template but not the rules
- **THEN** the existing rules remain active

#### Scenario: Rules optional
- **WHEN** no rules file has been provided
- **THEN** drafting is still possible using the template alone

### Requirement: Template required for drafting
The system MUST NOT draft a record until a template has been provided and SHALL tell the user why.

#### Scenario: No template
- **WHEN** the user requests a draft and no template exists
- **THEN** the app does not contact OpenRouter and asks the user to provide a template

### Requirement: Inputs visible before use
The system SHALL show the user the active template and rules so they can see what will be applied.

#### Scenario: Review active inputs
- **WHEN** the user opens the template or rules view
- **THEN** the full current text is displayed and editable
