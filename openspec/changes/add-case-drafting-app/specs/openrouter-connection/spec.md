# Spec Delta

## Purpose

Lets the single user connect their own OpenRouter account from the browser, keep the resulting key on that device only, choose the model used for drafting, and understand failures.

## ADDED Requirements

### Requirement: Connect through OpenRouter authorization
The system SHALL let the user connect by authorizing the app on OpenRouter and SHALL store the resulting API key only in the current browser.

#### Scenario: Successful connection
- **WHEN** the user clicks "Connect OpenRouter" and authorizes the app on OpenRouter
- **THEN** the app returns to its own page, obtains a key for the user's account, and shows a connected status

#### Scenario: User denies authorization
- **WHEN** the user returns from OpenRouter without authorizing
- **THEN** the app stays disconnected and shows that the connection was not completed

#### Scenario: Key is not published
- **WHEN** the app is built and hosted
- **THEN** no API key is present in the repository, the build output, or the hosted files

### Requirement: Disconnect
The system SHALL let the user disconnect, which MUST remove the stored key from the browser.

#### Scenario: Disconnect removes key
- **WHEN** the user clicks "Disconnect"
- **THEN** the stored key is deleted and drafting is unavailable until the user connects again

### Requirement: Model selection
The system SHALL let the user choose the OpenRouter model used for drafting and SHALL remember the choice in the browser.

#### Scenario: Default model on first use
- **WHEN** the user connects and has not chosen a model
- **THEN** the app uses a default model and shows which model is selected

#### Scenario: Chosen model persists
- **WHEN** the user selects another model and reloads the app
- **THEN** the selected model is still in use

### Requirement: Clear failure messages
The system SHALL show a distinct, actionable message when a drafting request fails because of insufficient credits, an invalid or revoked key, or rate limiting.

#### Scenario: Insufficient credits
- **WHEN** OpenRouter rejects a request because credits are insufficient
- **THEN** the app tells the user to add credits or raise the key limit, and keeps the entered key points

#### Scenario: Revoked or invalid key
- **WHEN** OpenRouter rejects the key as unauthorized
- **THEN** the app marks itself disconnected and prompts the user to connect again

#### Scenario: Rate limited
- **WHEN** OpenRouter reports a rate limit
- **THEN** the app tells the user to retry later and keeps the entered key points
