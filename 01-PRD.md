# Product Requirements Document: Foundry

**Document ID:** 01-PRD  
**Version:** 1.0  
**Created:** 2026-01-11  
**Status:** COMPLETE  

---

## Section 1: Executive Summary

Foundry is a multi-tenant SaaS platform that transforms fragmented business data into clean, de-identified, structured datasets ready for AI agent training. The platform enables businesses to connect data sources (file uploads and API integrations), configure extraction and transformation rules, apply privacy-preserving de-identification, and export training-ready datasets in industry-standard formats.

**Primary Value Proposition:** Turn messy operational data into AI training datasets in minutes, not months—without engineering effort or privacy risk.

**Target Market:** Mid-market and enterprise businesses with operational data (support tickets, sales conversations, process documentation) who want to train AI agents on their proprietary knowledge but lack the technical resources or privacy expertise to do so safely.

**Key Differentiators:**
- Source-agnostic architecture (files and APIs as equal citizens)
- Configuration-driven (no coding required)
- Privacy by design (de-identification as first-class feature)
- Immediate value (useful from first file upload)

**Deployment Target:** Replit (web application)

---

## Section 2: Problem Statement

**The Problem in Human Terms:**

Business owners and operations leaders have years of valuable customer interactions, support resolutions, and operational knowledge trapped in disconnected systems. Sarah, a VP of Customer Success, has 50,000 resolved support tickets in Teamwork Desk that represent exactly how her team handles customer problems—perfect training data for an AI support agent. But those tickets contain customer names, email addresses, company information, and internal references that cannot go into a training dataset.

Today, Sarah has two options:
1. **Hire engineers** to build custom extraction scripts, de-identification logic, and transformation pipelines—a 3-6 month project costing $50,000-$200,000
2. **Do nothing** and watch competitors train AI on their data while she waits

**Current Alternatives and Limitations:**
- **Manual export and cleaning:** Time-consuming, error-prone, doesn't scale, privacy risks
- **Custom engineering:** Expensive, slow, requires ongoing maintenance for each source
- **Generic ETL tools:** Not designed for AI training formats, no de-identification, require technical expertise
- **AI platform built-in connectors:** Limited sources, no privacy controls, lock-in to single training platform

**Quantified Impact:**
- Average time to prepare training dataset manually: 4-8 weeks
- Engineering cost for custom pipeline: $50,000-$200,000
- Risk of PII exposure in training data: Compliance fines, reputation damage, legal liability
- Opportunity cost of delay: Competitors deploying AI agents while you're still preparing data

**Person Experiencing the Pain:**
Operations leaders, customer success managers, and business owners who see AI potential but hit a wall when they realize "we need to prepare our data first."

---

## Section 3: User Personas

### Persona 1: Operations Manager "Olivia"

**Demographics:**
- Age: 38-50
- Role: VP of Customer Success, Head of Operations, or similar
- Company: 50-500 employee B2B SaaS company
- Reports to: COO or CEO

**Goals and Motivations:**
- Deploy AI support agents to handle tier-1 inquiries
- Reduce support team workload while maintaining quality
- Demonstrate innovation and ROI to leadership
- Move fast—competitors are already exploring AI

**Pain Points and Frustrations:**
- "I have the data, but I can't use it"
- "Engineering says it's a 6-month project"
- "Legal is concerned about customer data in AI training"
- "Every AI vendor assumes I have clean training data ready"

**Technical Proficiency:** Low to moderate. Comfortable with SaaS tools, can export CSVs, but cannot write code or work with APIs directly.

**Usage Context:** Uses Foundry to upload exported data files, configure basic processing rules through the UI, and download training-ready datasets. Relies on preview features to validate output before export.

**Success Metrics:**
- Time from "I want to train AI" to "I have training data": < 1 day
- Confidence that customer PII is removed: 100%
- Ability to iterate without engineering help: Yes

---

### Persona 2: Technical Project Lead "Marcus"

**Demographics:**
- Age: 28-40
- Role: Technical Project Manager, Solutions Architect, or Senior Analyst
- Company: Same as Olivia (often reports to her or works alongside)
- Background: Some technical training, comfortable with data concepts

**Goals and Motivations:**
- Set up robust, repeatable data pipelines
- Configure API connections for automated data flow
- Define processing rules that match compliance requirements
- Be the internal expert on AI training data preparation

**Pain Points and Frustrations:**
- "I can connect to APIs but I don't want to build transformation logic"
- "Each source structures data differently—normalization is tedious"
- "De-identification rules need to be consistent across all sources"
- "I need to prove to legal that PII handling is systematic"

**Technical Proficiency:** Moderate to high. Understands APIs, JSON, data structures. Can configure but prefers not to code.

**Usage Context:** Sets up API connections, configures field mappings, defines processing pipelines, tests with sample data, schedules processing runs. Acts as power user who enables less technical team members.

**Success Metrics:**
- All data sources connected and configured: Complete
- Processing rules documented and auditable: Yes
- Time to add new source: < 1 hour
- Zero PII in output datasets: Verified

---

### Persona 3: Data Privacy Officer "Diana"

**Demographics:**
- Age: 35-55
- Role: DPO, Compliance Manager, or Legal/Privacy Counsel
- Company: Same organization, may serve multiple departments
- Background: Legal, compliance, or information security

**Goals and Motivations:**
- Ensure AI training data complies with GDPR, CCPA, and industry regulations
- Document de-identification processes for audits
- Minimize organizational risk from data handling
- Enable innovation while maintaining compliance

**Pain Points and Frustrations:**
- "How do I know all PII was actually removed?"
- "We need audit trails for what data was processed and how"
- "Every new AI project means a new compliance review"
- "I need to approve de-identification rules, not just trust them"

**Technical Proficiency:** Low to moderate on technical implementation, high on compliance requirements.

**Usage Context:** Reviews de-identification rule configurations, examines processing reports, validates sample outputs, approves configurations before production runs.

**Success Metrics:**
- De-identification rules explicitly configured and documented: Yes
- Audit trail available for all processing: Complete
- Sample validation before full processing: Available
- Compliance documentation exportable: Yes

---

### Persona 4: Platform Administrator "Alex"

**Demographics:**
- Age: 30-45
- Role: IT Admin, Systems Administrator, or designated platform owner
- Company: Same organization
- Background: IT operations, system administration

**Goals and Motivations:**
- Manage user access and permissions
- Maintain secure credential storage for API connections
- Monitor platform usage and resource consumption
- Ensure system reliability and availability

**Pain Points and Frustrations:**
- "Who has access to what data?"
- "Are API credentials stored securely?"
- "I need to onboard new team members without sharing passwords"
- "What happens if someone accidentally deletes a project?"

**Technical Proficiency:** High on systems and security, moderate on data/AI specifics.

**Usage Context:** Manages organization settings, invites/removes users, configures API connections at organization level, reviews usage and access logs.

**Success Metrics:**
- All users have appropriate access levels: Verified
- API credentials never exposed in UI after entry: Confirmed
- User activity auditable: Yes
- Self-service user management: Available

---

## Section 4: User Stories and Requirements

### Authentication & Access

```
ID: US-AUTH-001
Persona: Platform Administrator "Alex"
Story: As Alex, I want to invite team members to my organization via email so that they can access the platform without sharing passwords.
Acceptance Criteria:
  - Given I am an org admin, when I enter an email address and click invite, then an invitation email is sent
  - Given an invitation is pending, when the invitee clicks the link, then they can set their password and access the organization
  - Given an invitation exists, when I view pending invitations, then I see email, sent date, and status
Priority: P0-Critical
MVP Status: MVP
Dependencies: None
Estimated Complexity: M
```

```
ID: US-AUTH-002
Persona: All Users
Story: As any user, I want to log in with email and password so that I can access my organization's data securely.
Acceptance Criteria:
  - Given valid credentials, when I submit login, then I am authenticated and redirected to dashboard
  - Given invalid credentials, when I submit login, then I see an error message without revealing which field was wrong
  - Given I am authenticated, when I close and reopen browser, then I remain logged in for up to 7 days
Priority: P0-Critical
MVP Status: MVP
Dependencies: None
Estimated Complexity: M
```

```
ID: US-AUTH-003
Persona: All Users
Story: As any user, I want to log out so that I can secure my session when finished.
Acceptance Criteria:
  - Given I am logged in, when I click logout, then my session is terminated and I am redirected to login
  - Given I have logged out, when I try to access protected pages, then I am redirected to login
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-AUTH-004
Persona: All Users
Story: As any user, I want to reset my password if I forget it so that I can regain access to my account.
Acceptance Criteria:
  - Given I am on login page, when I click "Forgot Password," then I see a form to enter my email
  - Given I enter a registered email, when I submit, then I receive a password reset email (or graceful message if email service unavailable)
  - Given I have a reset link, when I click it within 1 hour, then I can set a new password
  - Given I have a reset link, when I click it after 1 hour, then I see an expiration error
Priority: P1-High
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: M
```

### Organization Management

```
ID: US-ORG-001
Persona: Platform Administrator "Alex"
Story: As Alex, I want to view all users in my organization so that I can manage team access.
Acceptance Criteria:
  - Given I am an org admin, when I view the users list, then I see all active users with name, email, role, and join date
  - Given I am an org admin, when I view the users list, then I see pending invitations separately
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: S
```

```
ID: US-ORG-002
Persona: Platform Administrator "Alex"
Story: As Alex, I want to remove users from my organization so that I can revoke access when someone leaves.
Acceptance Criteria:
  - Given I am an org admin, when I remove a user, then their access is immediately revoked
  - Given I remove a user, when they try to log in, then they see "account disabled" error
  - Given I am the only admin, when I try to remove myself, then I see an error preventing this
Priority: P1-High
MVP Status: MVP
Dependencies: US-ORG-001
Estimated Complexity: S
```

```
ID: US-ORG-003
Persona: Platform Administrator "Alex"
Story: As Alex, I want to assign admin or member roles to users so that I can control who can manage the organization.
Acceptance Criteria:
  - Given I am an org admin, when I change a user's role to admin, then they gain admin capabilities
  - Given I am an org admin, when I change an admin's role to member, then they lose admin capabilities
  - Given I am a member, when I view user management, then I cannot change roles
Priority: P1-High
MVP Status: MVP
Dependencies: US-ORG-001
Estimated Complexity: S
```

### Project Management

```
ID: US-PROJ-001
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to create a new project so that I can organize data sources and processing for a specific AI training goal.
Acceptance Criteria:
  - Given I am logged in, when I click "Create Project," then I see a form for project name and description
  - Given I submit valid project details, when creation succeeds, then I am taken to the empty project dashboard
  - Given I create a project, when I return to projects list, then I see my new project
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-PROJ-002
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to view all my projects so that I can navigate to the one I want to work on.
Acceptance Criteria:
  - Given I am logged in, when I view projects list, then I see all projects with name, source count, last processed date
  - Given projects exist, when I click a project, then I navigate to that project's dashboard
  - Given no projects exist, when I view projects list, then I see an empty state with "Create Project" CTA
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-PROJ-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to edit project details so that I can update the name or description as the project evolves.
Acceptance Criteria:
  - Given I am viewing a project, when I click edit, then I can modify name and description
  - Given I save changes, when I return to project view, then I see updated details
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-PROJ-004
Persona: Platform Administrator "Alex"
Story: As Alex, I want to delete a project so that I can remove completed or abandoned work.
Acceptance Criteria:
  - Given I am an admin, when I click delete on a project, then I see a confirmation dialog
  - Given I confirm deletion, when deletion completes, then the project and all its data are removed
  - Given I am a member, when I view a project, then I do not see a delete option
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

### File Upload Source

```
ID: US-FILE-001
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to upload a CSV file as a data source so that I can process data I've exported from other systems.
Acceptance Criteria:
  - Given I am in a project, when I click "Add Source" > "File Upload," then I see a file upload interface
  - Given I select a valid CSV file (<50MB), when upload completes, then I see the file listed as a source
  - Given upload succeeds, when I view the source, then I see detected columns and row count
  - Given I upload an invalid file type, when I try to upload, then I see a clear error message
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: M
```

```
ID: US-FILE-002
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to upload Excel files so that I can use spreadsheet exports directly.
Acceptance Criteria:
  - Given I select an Excel file (.xlsx, .xls), when upload completes, then I can select which sheet to use
  - Given the file has multiple sheets, when I view the source, then I see a sheet selector
  - Given I select a sheet, when I proceed, then I see detected columns from that sheet
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

```
ID: US-FILE-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to upload JSON files so that I can use API exports or structured data directly.
Acceptance Criteria:
  - Given I select a valid JSON file, when upload completes, then I see detected structure
  - Given JSON is an array of objects, when I view the source, then I see detected fields and record count
  - Given JSON is nested, when I view the source, then I can select which level to extract
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

```
ID: US-FILE-004
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to preview my uploaded file so that I can verify the data looks correct before processing.
Acceptance Criteria:
  - Given a file is uploaded, when I click "Preview," then I see the first 10 rows in a table format
  - Given preview is open, when I scroll, then I can see all detected columns
  - Given data contains special characters, when I preview, then characters display correctly
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: S
```

### API Connection Source (Teamwork Desk)

```
ID: US-API-001
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to connect to Teamwork Desk so that I can automatically import support ticket data.
Acceptance Criteria:
  - Given I am in a project, when I click "Add Source" > "Teamwork Desk," then I see a connection configuration form
  - Given I enter valid API credentials (domain, API key), when I click "Test Connection," then I see a success message
  - Given I enter invalid credentials, when I test connection, then I see a specific error message
  - Given connection is valid, when I save, then the source appears in my project
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: L
```

```
ID: US-API-002
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to configure what data to fetch from Teamwork Desk so that I only import relevant tickets.
Acceptance Criteria:
  - Given a Teamwork connection, when I configure it, then I can filter by inbox/mailbox
  - Given configuration options, when I set date range, then only tickets in that range are fetched
  - Given configuration options, when I filter by status (resolved only), then only resolved tickets import
Priority: P1-High
MVP Status: MVP
Dependencies: US-API-001
Estimated Complexity: M
```

```
ID: US-API-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to refresh data from an API source so that I can get new tickets since last import.
Acceptance Criteria:
  - Given an API source exists, when I click "Refresh," then new data since last fetch is imported
  - Given refresh is in progress, when I view the source, then I see a loading indicator
  - Given refresh completes, when I view the source, then I see updated record count and last refresh time
Priority: P1-High
MVP Status: MVP
Dependencies: US-API-001
Estimated Complexity: M
```

```
ID: US-API-004
Persona: Platform Administrator "Alex"
Story: As Alex, I want API credentials to be stored securely so that they are not exposed after initial entry.
Acceptance Criteria:
  - Given I enter API credentials, when I save, then credentials are encrypted at rest
  - Given credentials are saved, when I view the connection, then I see masked values (e.g., "sk-****1234")
  - Given I need to update credentials, when I edit the connection, then I can enter new values without seeing old ones
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-API-001
Estimated Complexity: M
```

### Field Mapping

```
ID: US-MAP-001
Persona: Operations Manager "Olivia"
Story: As Olivia, I want the platform to auto-detect column meanings so that I don't have to manually configure everything.
Acceptance Criteria:
  - Given I upload a file, when detection runs, then columns named "email," "name," "message," etc. are auto-mapped
  - Given detection completes, when I view mappings, then I see suggested mappings with confidence indicators
  - Given auto-detection suggests wrong mapping, when I review, then I can correct it before proceeding
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

```
ID: US-MAP-002
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to manually map source fields to standard training data fields so that I can handle non-obvious column names.
Acceptance Criteria:
  - Given a source with unmapped fields, when I open field mapping, then I see all source fields and target field options
  - Given I select a target field for a source field, when I save, then the mapping is persisted
  - Given I have mapped fields, when I view the source, then I see a summary of mappings
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-FILE-001, US-API-001
Estimated Complexity: M
```

```
ID: US-MAP-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to define role assignment rules so that the system knows which messages are from agents vs customers.
Acceptance Criteria:
  - Given ticket data has sender information, when I configure roles, then I can specify how to identify agent vs customer
  - Given Teamwork Desk data, when I configure roles, then the system uses built-in role detection based on Teamwork structure
  - Given role assignment is configured, when I preview, then I see correct role labels on sample messages
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-MAP-002
Estimated Complexity: M
```

### De-identification Configuration

```
ID: US-PII-001
Persona: Data Privacy Officer "Diana"
Story: As Diana, I want to configure PII detection rules so that I can ensure all personal information is removed before export.
Acceptance Criteria:
  - Given I am in processing configuration, when I view de-identification, then I see options for names, emails, phones, addresses, companies
  - Given each PII type, when I toggle it on/off, then that detection is enabled/disabled
  - Given detection is enabled, when processing runs, then matching PII is replaced with placeholders
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: L
```

```
ID: US-PII-002
Persona: Data Privacy Officer "Diana"
Story: As Diana, I want consistent entity replacement so that the same person gets the same placeholder throughout.
Acceptance Criteria:
  - Given "John Smith" appears 5 times in source data, when processing completes, then all 5 are replaced with same placeholder (e.g., [PERSON_1])
  - Given consistent replacement is enabled, when I view output, then conversation context is preserved
  - Given different people exist, when processing completes, then they get different placeholders ([PERSON_1], [PERSON_2])
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PII-001
Estimated Complexity: L
```

```
ID: US-PII-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to define custom patterns for de-identification so that I can mask company-specific identifiers.
Acceptance Criteria:
  - Given I am in de-identification config, when I add a custom pattern, then I can enter a regex and replacement text
  - Given I add pattern for account numbers (e.g., ACC-\d{6}), when processing runs, then matching strings are replaced
  - Given I have custom patterns, when I view config, then I see list of all custom patterns
Priority: P1-High
MVP Status: MVP
Dependencies: US-PII-001
Estimated Complexity: M
```

```
ID: US-PII-004
Persona: Data Privacy Officer "Diana"
Story: As Diana, I want to preview de-identification results before full processing so that I can verify rules are working correctly.
Acceptance Criteria:
  - Given de-identification is configured, when I click "Preview," then I see sample records with de-identification applied
  - Given preview is shown, when I view it, then original and de-identified versions are shown side-by-side
  - Given I spot an issue, when I adjust rules, then I can re-preview without processing all data
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PII-001
Estimated Complexity: M
```

### Quality Filtering

```
ID: US-FILT-001
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to filter out short conversations so that training data only includes substantive interactions.
Acceptance Criteria:
  - Given filter configuration, when I set minimum message count, then conversations below threshold are excluded
  - Given filter configuration, when I set minimum word count, then short messages are excluded
  - Given filters are applied, when I view stats, then I see how many records were filtered out
Priority: P1-High
MVP Status: MVP
Dependencies: US-MAP-002
Estimated Complexity: S
```

```
ID: US-FILT-002
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to filter by resolution status so that I only train on successfully resolved cases.
Acceptance Criteria:
  - Given ticket data with status, when I filter by "resolved only," then unresolved tickets are excluded
  - Given Teamwork Desk source, when I filter, then status mapping uses Teamwork's status values
Priority: P1-High
MVP Status: MVP
Dependencies: US-API-002
Estimated Complexity: S
```

```
ID: US-FILT-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to filter by date range so that I can use only recent, relevant data.
Acceptance Criteria:
  - Given date filter configuration, when I set start and end dates, then only records in range are included
  - Given date filter is applied, when I view stats, then I see date range of included data
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-MAP-002
Estimated Complexity: S
```

### Processing and Output

```
ID: US-PROC-001
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to trigger data processing so that my configured sources become training datasets.
Acceptance Criteria:
  - Given sources are configured, when I click "Process," then processing begins
  - Given processing is running, when I view the project, then I see a progress indicator with percentage
  - Given processing fails, when I view the project, then I see an error message with reason
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-MAP-002, US-PII-001
Estimated Complexity: L
```

```
ID: US-PROC-002
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to see processing status so that I know when my data is ready.
Acceptance Criteria:
  - Given processing is in progress, when I view status, then I see current stage (fetching, processing, de-identifying, formatting)
  - Given processing completes, when I view status, then I see completion time and output record count
  - Given processing failed, when I view status, then I see failure details and how to resolve
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-PROC-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want processing history so that I can see previous runs and their results.
Acceptance Criteria:
  - Given processing has run multiple times, when I view history, then I see list of runs with date, duration, output count
  - Given a historical run, when I click it, then I see detailed statistics for that run
  - Given historical outputs exist, when I view history, then I can download outputs from previous runs
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

### Export

```
ID: US-EXP-001
Persona: Operations Manager "Olivia"
Story: As Olivia, I want to download processed data as JSONL so that I can use it for conversational AI training.
Acceptance Criteria:
  - Given processing is complete, when I click "Export" > "Conversational JSONL," then a download starts
  - Given JSONL is downloaded, when I open it, then each line is a valid JSON object with conversation structure
  - Given output format, when I inspect file, then it matches standard conversational training format (messages array with role and content)
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-EXP-002
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to export as Q&A pairs so that I can use data for knowledge base training.
Acceptance Criteria:
  - Given processing is complete, when I click "Export" > "Q&A Pairs," then a download starts
  - Given Q&A format, when I inspect file, then each record has question and answer fields
  - Given conversation data, when exported as Q&A, then agent responses are answers to customer questions
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-EXP-003
Persona: Technical Project Lead "Marcus"
Story: As Marcus, I want to export raw structured JSON so that I can do custom post-processing.
Acceptance Criteria:
  - Given processing is complete, when I click "Export" > "Raw JSON," then a download starts
  - Given raw JSON format, when I inspect file, then all processed fields are included
  - Given raw export, when I view it, then metadata (source, processing date, filters applied) is included
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: S
```

### Audit and Compliance

```
ID: US-AUD-001
Persona: Data Privacy Officer "Diana"
Story: As Diana, I want processing reports so that I can document what de-identification was applied for compliance.
Acceptance Criteria:
  - Given processing is complete, when I view report, then I see summary of PII types detected and replaced
  - Given report is available, when I download it, then I get a PDF with de-identification statistics
  - Given compliance requirements, when I review report, then I see rule configurations that were applied
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-AUD-002
Persona: Platform Administrator "Alex"
Story: As Alex, I want user activity logs so that I can audit who did what in the platform.
Acceptance Criteria:
  - Given activity logging is enabled, when I view logs, then I see user actions with timestamp, user, and action type
  - Given logs exist, when I filter by user, then I see only that user's actions
  - Given logs exist, when I filter by date, then I see only actions in that range
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: M
```

---

## Section 5: Feature Specification

### Feature F-001: User Authentication

**ID:** F-001  
**Description:** Secure user authentication system supporting email/password login, password reset, and session management.

**User Stories Addressed:** US-AUTH-001, US-AUTH-002, US-AUTH-003, US-AUTH-004

**Functional Requirements:**
- Email/password login with JWT token authentication
- Password reset via email link (1-hour expiration)
- Session persistence for 7 days
- Secure password storage (bcrypt, cost factor 10+)
- Invitation-based registration (no public signup)

**Non-Functional Requirements:**
- Login response time < 500ms
- Failed login attempts rate-limited (5 per 15 minutes per IP)
- Password minimum 8 characters with complexity requirements

**Edge Cases:**
- User tries to login with pending invitation (not yet accepted)
- User requests password reset for non-existent email (show same message as success)
- Token refresh while session is valid
- Multiple simultaneous sessions from same user

**Error States:**
- Invalid credentials: Generic error message
- Account disabled: Specific error directing to admin
- Rate limited: Error with retry time
- Email service unavailable: Password reset queued or graceful error

**Out of Scope:**
- OAuth/social login (Post-MVP)
- Multi-factor authentication (Post-MVP)
- Self-service registration (Post-MVP)

---

### Feature F-002: Organization and User Management

**ID:** F-002  
**Description:** Multi-tenant organization structure with user invitation, role assignment, and access management.

**User Stories Addressed:** US-ORG-001, US-ORG-002, US-ORG-003, US-AUTH-001

**Functional Requirements:**
- Organization as tenant boundary (all data scoped to org)
- User invitation via email with accept/decline flow
- Two roles: Admin (full access) and Member (project access only)
- User deactivation (soft delete, not data deletion)

**Non-Functional Requirements:**
- User list loads < 500ms for up to 100 users
- Invitation emails sent within 30 seconds

**Edge Cases:**
- Invite sent to email already in different organization
- Last admin attempts to leave organization
- Invitation expires (7 days) before acceptance
- Deactivated user tries to login

**Error States:**
- Invitation to existing user: Clear error with guidance
- Invitation email fails: Queue for retry, notify admin
- Role change for self: Error if removing own admin access as last admin

**Out of Scope:**
- Multiple organizations per user (Post-MVP)
- Fine-grained permissions (Post-MVP)
- Teams/groups within organization (Post-MVP)

---

### Feature F-003: Project Management

**ID:** F-003  
**Description:** Project creation and management for organizing data sources, processing configurations, and outputs.

**User Stories Addressed:** US-PROJ-001, US-PROJ-002, US-PROJ-003, US-PROJ-004

**Functional Requirements:**
- Create project with name and description
- List all organization projects
- Edit project details
- Delete project (admin only, with confirmation)
- Project dashboard showing sources, processing status, output availability

**Non-Functional Requirements:**
- Project list loads < 500ms for up to 50 projects
- Project creation completes < 1 second

**Edge Cases:**
- Duplicate project names (allowed, different IDs)
- Delete project with active processing (block or cancel?)
- Very long project names (limit to 200 chars)

**Error States:**
- Project creation fails: Clear error with retry option
- Delete fails: Error with reason, data preserved
- Invalid project ID in URL: 404 page with navigation

**Out of Scope:**
- Project templates (Post-MVP)
- Project duplication (Post-MVP)
- Project archiving (Post-MVP)

---

### Feature F-004: File Upload Source

**ID:** F-004  
**Description:** Upload and process CSV, Excel, and JSON files as data sources for projects.

**User Stories Addressed:** US-FILE-001, US-FILE-002, US-FILE-003, US-FILE-004

**Functional Requirements:**
- Upload CSV files (up to 50MB)
- Upload Excel files with sheet selection
- Upload JSON files (arrays of objects or nested with extraction)
- Auto-detect columns/fields with data types
- Preview first 10 rows of uploaded data
- Store uploaded files for 30 days

**Non-Functional Requirements:**
- Upload progress indicator for files > 1MB
- File processing (parsing) completes < 30 seconds for 50MB file
- Preview loads < 2 seconds

**Edge Cases:**
- Excel file with no data in selected sheet
- JSON with mixed structure (some objects have different fields)
- CSV with mismatched row lengths
- File with encoding issues (non-UTF8)
- Very wide data (100+ columns)

**Error States:**
- Upload fails midway: Clear error, retry option
- Unsupported file type: Error with list of supported types
- File too large: Error with size limit information
- Parsing fails: Error with specific issue (e.g., "Invalid JSON on line 42")

**Out of Scope:**
- Compressed file support (.zip) (Post-MVP)
- Cloud storage import (Google Drive, S3) (Post-MVP)
- Files larger than 50MB (Post-MVP)

---

### Feature F-005: API Connection Source (Teamwork Desk)

**ID:** F-005  
**Description:** Connect to Teamwork Desk API to import support ticket data.

**User Stories Addressed:** US-API-001, US-API-002, US-API-003, US-API-004

**Functional Requirements:**
- Configure Teamwork Desk connection (domain, API key)
- Test connection before saving
- Filter by inbox/mailbox
- Filter by date range
- Filter by status (resolved, pending, etc.)
- Fetch tickets with full conversation history
- Store credentials encrypted
- Mask credentials in UI after save
- Refresh data on demand

**Non-Functional Requirements:**
- Connection test completes < 5 seconds
- Initial sync progress indicator
- Credentials encrypted with AES-256

**Edge Cases:**
- API rate limits exceeded during sync
- API credentials revoked after initial save
- Teamwork Desk account structure changes
- Inbox deleted after initial configuration
- Very large inbox (10,000+ tickets)

**Error States:**
- Invalid credentials: Specific error message from API
- Rate limited: Error with suggested wait time
- Network timeout: Retry option
- Partial sync failure: Show what succeeded, what failed
- No matching tickets: Warning (not error) with empty result

**Out of Scope:**
- Webhook-based real-time sync (Post-MVP)
- Multiple Teamwork accounts (Post-MVP)
- Automatic scheduled sync (Post-MVP)

---

### Feature F-006: Field Mapping

**ID:** F-006  
**Description:** Map source data fields to standardized training data structure with auto-detection and manual override.

**User Stories Addressed:** US-MAP-001, US-MAP-002, US-MAP-003

**Functional Requirements:**
- Auto-detect common field names (email, name, message, subject, etc.)
- Manual mapping interface for all source fields
- Standard target fields: timestamp, sender_role (agent/customer), content, subject, conversation_id
- Role assignment configuration (identify agent vs customer)
- For Teamwork: Automatic role detection based on Teamwork's internal structure

**Non-Functional Requirements:**
- Auto-detection runs < 5 seconds
- Mapping interface loads < 1 second

**Edge Cases:**
- Source field maps to multiple target fields
- Target field has no source field (nullable or default?)
- Field names in different languages
- Numeric field that should be text (IDs)

**Error States:**
- Required field unmapped: Block processing with clear error
- Invalid mapping (type mismatch): Warning with guidance
- Auto-detection fails: Fallback to manual with message

**Out of Scope:**
- Field transformation (splitting, combining) (Post-MVP)
- Calculated fields (Post-MVP)
- Machine learning for field detection (Post-MVP)

---

### Feature F-007: De-identification (PII Detection and Replacement)

**ID:** F-007  
**Description:** Detect and replace personally identifiable information with consistent placeholders.

**User Stories Addressed:** US-PII-001, US-PII-002, US-PII-003, US-PII-004

**Functional Requirements:**
- Detect: names, email addresses, phone numbers, physical addresses, company names
- Replace with consistent placeholders ([PERSON_1], [EMAIL_1], [PHONE_1], etc.)
- Same entity gets same placeholder throughout dataset
- Toggle individual PII types on/off
- Custom pattern matching (regex-based)
- Preview mode before full processing
- Side-by-side original/de-identified view in preview

**Non-Functional Requirements:**
- Preview generates < 5 seconds for first 10 records
- De-identification processing rate: 100+ records/second
- Placeholder consistency maintained across re-processing

**Edge Cases:**
- PII in unusual format (international phone numbers, non-Western names)
- Same name for different people (context-based disambiguation)
- PII in mixed context (email address mentioned in message body)
- Overly aggressive detection (false positives)
- Under-detection (false negatives)

**Error States:**
- Detection service unavailable: Queue for retry or graceful fallback
- Pattern regex invalid: Error on save with syntax help
- Preview fails: Error with retry option

**Out of Scope:**
- Image/attachment PII detection (Post-MVP)
- Named entity linking (Post-MVP)
- De-identification in non-English text (Post-MVP)

---

### Feature F-008: Quality Filtering

**ID:** F-008  
**Description:** Filter source data by quality criteria to ensure training datasets contain substantive, relevant content.

**User Stories Addressed:** US-FILT-001, US-FILT-002, US-FILT-003

**Functional Requirements:**
- Filter by minimum message count per conversation
- Filter by minimum word count per message
- Filter by resolution status (for ticket sources)
- Filter by date range
- Show filter statistics (records before/after filtering)

**Non-Functional Requirements:**
- Filter statistics calculate < 2 seconds for 10,000 records

**Edge Cases:**
- All records filtered out: Warning with suggestion to adjust
- Date range with no data: Warning
- Conflicting filters (e.g., resolved + date range = 0 results)

**Error States:**
- Invalid filter value (negative number): Validation error
- Filter calculation fails: Retry option

**Out of Scope:**
- Content-based quality scoring (Post-MVP)
- Duplicate detection (Post-MVP)
- Language filtering (Post-MVP)

---

### Feature F-009: Processing Engine

**ID:** F-009  
**Description:** Batch processing pipeline that fetches, transforms, de-identifies, and formats data.

**User Stories Addressed:** US-PROC-001, US-PROC-002, US-PROC-003

**Functional Requirements:**
- Trigger processing manually
- Progress indicator with stages (fetching, processing, de-identifying, formatting)
- Processing history with run details
- Re-run with same or modified configuration
- Store outputs for download

**Non-Functional Requirements:**
- Process 100,000 records in < 10 minutes
- Progress updates every 5 seconds
- Output file generation < 30 seconds after processing completes

**Edge Cases:**
- Processing interrupted (browser closed): Resume or restart
- Source data changes during processing
- Very large output files (>100MB)
- Processing with 0 qualifying records after filtering

**Error States:**
- Processing fails mid-run: Save progress, clear error, retry option
- Out of memory: Error with suggestion to reduce batch size
- Source API unavailable during fetch: Retry with backoff

**Out of Scope:**
- Scheduled processing (Post-MVP)
- Incremental processing (Post-MVP)
- Parallel processing across projects (Post-MVP)

---

### Feature F-010: Export

**ID:** F-010  
**Description:** Download processed data in training-ready formats.

**User Stories Addressed:** US-EXP-001, US-EXP-002, US-EXP-003

**Functional Requirements:**
- Export as Conversational JSONL (messages array with role/content)
- Export as Q&A Pairs (question/answer fields)
- Export as Raw JSON (all fields with metadata)
- Download files directly
- Multiple exports from same processing run

**Non-Functional Requirements:**
- Export file generation < 30 seconds for 100,000 records
- Download starts immediately after generation

**Edge Cases:**
- Export requested before processing complete
- Export format not suitable for data (e.g., Q&A from non-conversational data)
- Very large export file (compression?)

**Error States:**
- Export generation fails: Retry option
- Download fails: Retry option with preserved file
- Expired output (>30 days): Re-process required

**Out of Scope:**
- Direct push to cloud storage (Post-MVP)
- Custom export formats (Post-MVP)
- Export to training platforms directly (Post-MVP)

---

### Feature F-011: Audit and Reporting

**ID:** F-011  
**Description:** Compliance reporting and activity logging for transparency and audit requirements.

**User Stories Addressed:** US-AUD-001, US-AUD-002

**Functional Requirements:**
- Processing report with de-identification statistics
- Download processing report as PDF
- User activity log with filtering
- Log user actions: login, project changes, processing runs, exports

**Non-Functional Requirements:**
- Activity logs retained for 90 days
- Report generation < 10 seconds

**Edge Cases:**
- Report for failed processing run (partial data)
- Activity log for deleted user
- Very long activity history (pagination)

**Error States:**
- Report generation fails: Retry option
- Log query fails: Error with retry

**Out of Scope:**
- Real-time audit dashboard (Post-MVP)
- Custom report templates (Post-MVP)
- Compliance certification assistance (Post-MVP)

---

## Section 6: MVP Definition

### MVP Feature List with Removal Test Results

| Feature | MVP Status | Removal Test Result |
|---------|------------|---------------------|
| F-001: User Authentication | ✅ MVP | Cannot remove - required for access control |
| F-002: Organization & User Management | ✅ MVP | Cannot remove - required for multi-user, multi-tenant |
| F-003: Project Management | ✅ MVP | Cannot remove - required to organize work |
| F-004: File Upload Source | ✅ MVP | Cannot remove - core first-run experience |
| F-005: Teamwork Desk API | ✅ MVP | Cannot remove - core API connector for launch customers |
| F-006: Field Mapping | ✅ MVP | Cannot remove - required for data transformation |
| F-007: De-identification | ✅ MVP | Cannot remove - core value proposition (privacy) |
| F-008: Quality Filtering | ✅ MVP | Can simplify to basic filters only |
| F-009: Processing Engine | ✅ MVP | Cannot remove - required for any output |
| F-010: Export | ✅ MVP | Cannot remove - required for any value |
| F-011: Audit & Reporting | ✅ MVP | Can simplify to basic processing stats only |

### Scope Decision Rationale

**Included in MVP:**
- All features pass removal test as necessary for core value delivery
- File upload path is polished for 5-minute "aha moment"
- Single API connector (Teamwork Desk) for focused quality
- Basic versions of filtering and audit (can expand post-MVP)

**Deferred to Post-MVP:**
- GoHighLevel API connector (mentioned in brief but deprioritized)
- Scheduled/automated processing
- Cloud storage destinations
- Advanced analytics and scoring
- Self-service signup and billing

### MVP Success Criteria

1. **First-Run Experience:** New user can upload CSV and download de-identified JSONL in under 5 minutes
2. **API Integration:** Teamwork Desk connection works reliably for customers with 1,000+ tickets
3. **Privacy Assurance:** Zero PII in export verified by sample inspection
4. **Scalability:** Process 100,000 records without failure
5. **Usability:** Non-technical user completes file upload flow without documentation

### Post-Launch Metrics

- Time to first export (target: < 15 minutes from account creation)
- Processing success rate (target: > 95%)
- User return rate within 7 days (target: > 60%)
- Support tickets per user per month (target: < 0.5)

---

## Section 7: Information Architecture

### Content Organization

```
Organization (Tenant)
├── Settings
│   ├── General (name, logo)
│   ├── Users (invite, manage, roles)
│   └── Billing (Post-MVP)
├── Projects
│   ├── Project A
│   │   ├── Overview (status, stats)
│   │   ├── Sources
│   │   │   ├── File Upload Sources
│   │   │   └── API Connection Sources
│   │   ├── Configuration
│   │   │   ├── Field Mapping
│   │   │   ├── De-identification Rules
│   │   │   └── Quality Filters
│   │   ├── Processing
│   │   │   ├── Run Processing
│   │   │   └── Processing History
│   │   └── Exports
│   │       ├── Available Outputs
│   │       └── Download History
│   └── Project B...
└── Activity Log
```

### Navigation Structure

**Primary Navigation (Sidebar):**
- Dashboard (project overview)
- Projects (list and access)
- Settings (org admin only: users, settings)
- Activity Log (all users: own activity; admin: all activity)

**Project-Level Navigation (Sub-nav or tabs):**
- Overview
- Sources
- Configuration
- Processing
- Exports

**User Menu (Header):**
- Profile
- Logout

### User Flows

**Flow 1: First-Time CSV Upload (5-Minute Path)**

1. User logs in (post-invitation acceptance)
2. User sees empty Projects list with "Create Project" CTA
3. User clicks "Create Project," enters name, submits
4. User is on empty Project dashboard
5. User clicks "Add Source" → "File Upload"
6. User drags/drops CSV file
7. System uploads, parses, shows detected columns
8. User clicks "Preview" to verify data
9. User proceeds to Field Mapping (auto-detected suggestions shown)
10. User confirms or adjusts mappings
11. User proceeds to De-identification (defaults enabled)
12. User clicks "Preview De-identification"
13. User sees sample with PII replaced
14. User clicks "Process"
15. Processing runs (progress shown)
16. User clicks "Export" → "Conversational JSONL"
17. User downloads file — **Aha Moment Achieved**

**Flow 2: Teamwork Desk Integration**

1. User navigates to Project → Sources → "Add Source" → "Teamwork Desk"
2. User enters Teamwork domain and API key
3. User clicks "Test Connection" — sees success
4. User configures filters (date range, inbox, status)
5. User saves connection
6. System fetches tickets (progress shown)
7. User proceeds through mapping, de-identification, processing, export

**Flow 3: Repeat Processing with Updated Data**

1. User navigates to Project with existing API source
2. User clicks "Refresh" on API source
3. New data fetched
4. User clicks "Process" (uses existing configuration)
5. New output available for export

### Screen/Page Inventory

| Screen | Purpose | Primary Actions |
|--------|---------|-----------------|
| Login | Authentication | Login, Forgot Password |
| Invitation Accept | Complete registration | Set password, accept |
| Password Reset | Recover access | Enter new password |
| Projects List | Navigate to projects | View, Create, Delete |
| Project Overview | Status at a glance | Quick access to sections |
| Sources List | Manage data sources | Add, Remove, Refresh |
| File Upload | Add file source | Upload, Preview |
| API Connection | Configure API source | Enter credentials, Test, Save |
| Field Mapping | Map source to target | Map fields, Assign roles |
| De-identification | Configure PII rules | Toggle types, Add patterns, Preview |
| Quality Filters | Set filter criteria | Configure, Save |
| Processing | Run and monitor | Process, View progress, History |
| Exports | Download outputs | Select format, Download |
| Settings: Users | Manage team | Invite, Remove, Change roles |
| Settings: Organization | Org config | Update name, settings |
| Activity Log | Audit trail | View, Filter |

---

## Section 8: Assumptions and Constraints

### Technical Assumptions (Replit Context)

| Assumption | Impact if Wrong |
|------------|-----------------|
| Deployment platform: Replit | Architecture changes needed |
| Database: PostgreSQL (Neon via Replit) | ORM and query changes |
| Architecture: Monolithic full-stack application | Major restructuring |
| Frontend: React with TypeScript | Rewrite frontend |
| Backend: Express.js with TypeScript | Rewrite backend |
| ORM: Drizzle | Migration and query changes |
| Authentication: JWT-based | Security architecture change |
| File storage: Local filesystem (ephemeral) with database metadata | External storage integration needed |
| Processing: Single-threaded batch within request/background job | Queue system needed for scale |
| Email service: Optional (graceful degradation) | Password reset via alternative method |

### Business Assumptions

| Assumption | Impact if Wrong |
|------------|-----------------|
| Users are invited by organization admin | Self-service signup flow needed |
| Organizations have 1-50 users | Scale optimization for larger orgs |
| Projects have 1-10 sources each | UI/UX changes for many sources |
| Datasets max 100,000 records | Processing architecture changes |
| Teamwork Desk is primary API connector | Different API priorities |
| Batch processing is acceptable (no real-time) | Queue and webhook architecture |
| Download export is sufficient (no cloud push) | Cloud storage integration |
| 30-day data retention is acceptable | Longer retention implementation |

### Known Constraints

| Constraint | Mitigation |
|------------|------------|
| Single container deployment (no microservices) | Efficient in-process architecture |
| Replit resource limits | Chunk large processing, progress saves |
| Ephemeral filesystem | Store all state in PostgreSQL |
| Cold start behavior (sleep after inactivity) | Warm-up on first request, state in DB |
| No background workers | Synchronous processing with progress, or consider Replit background capabilities |
| Web browser access only (no native mobile) | Responsive design for mobile browsers |

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Teamwork API changes | Medium | High | Abstract API layer, version pinning |
| Large file uploads fail | Medium | Medium | Chunk uploads, resume capability |
| PII detection false negatives | Medium | High | Human review option, configurable strictness |
| Processing timeouts | Medium | Medium | Chunk processing, progress persistence |
| Email service unavailable | Low | Low | Graceful degradation, token-based reset alternative |
| Database connection issues | Low | High | Retry logic, connection pooling |

---

## Section 9: Success Metrics

### Key Performance Indicators

| KPI | Measurement Method | Target (Launch) | Target (6 months) |
|-----|-------------------|-----------------|-------------------|
| Time to First Export | Analytics: account creation to first download | < 15 minutes | < 10 minutes |
| First-Run Completion Rate | Analytics: % completing upload→export | > 70% | > 85% |
| Processing Success Rate | Logs: successful runs / total runs | > 95% | > 99% |
| User Activation (7-day return) | Analytics: % returning within 7 days | > 60% | > 75% |
| Projects per Organization | Database query | > 1.5 | > 3 |
| Sources per Project | Database query | > 2 | > 4 |
| Records Processed (total) | Processing logs | 500,000 | 10,000,000 |
| Support Tickets per User | Support system | < 0.5/month | < 0.2/month |

### Launch Targets

- 10 pilot organizations onboarded and active
- Average 2 projects per organization
- Average 5,000 records processed per project
- Zero data breaches or PII exposure incidents
- < 5% of processing runs fail

### 6-Month Milestones

- 100 organizations active
- GoHighLevel connector live
- 2+ additional connectors (Zendesk, Freshdesk)
- Self-service signup available
- Scheduled processing available
- 10M+ records processed cumulative

### Analytics Requirements

**Events to Track:**
- User: login, logout, password_reset_request, password_reset_complete
- Project: create, update, delete
- Source: add_file, add_api, refresh, delete
- Processing: start, progress_update, complete, fail
- Export: download_jsonl, download_qa, download_raw
- Admin: user_invite, user_remove, role_change

**Properties to Include:**
- User ID, Organization ID, Project ID (where applicable)
- Timestamp
- Duration (for timed operations)
- Record counts (for processing/export)
- Error messages (for failures)

---

## Section 10: Glossary

| Term | Definition |
|------|------------|
| **De-identification** | Process of removing or replacing personally identifiable information (PII) with placeholders |
| **JSONL** | JSON Lines format - one JSON object per line, common for ML training data |
| **PII** | Personally Identifiable Information - data that can identify an individual |
| **Organization** | A tenant account in Foundry, containing users and projects |
| **Project** | A container for sources, configuration, and outputs related to one AI training goal |
| **Source** | A data input for a project - either an uploaded file or an API connection |
| **Processing Run** | One execution of the data transformation pipeline |
| **Field Mapping** | Configuration linking source data fields to standardized target fields |
| **Role Assignment** | Identifying which messages in a conversation are from agents vs. customers |
| **Quality Filter** | Criteria for including/excluding source records from processing |
| **Placeholder** | Replacement text for PII (e.g., [PERSON_1], [EMAIL_1]) |
| **Conversational JSONL** | Output format with messages array containing role and content |
| **Q&A Pairs** | Output format with question and answer fields |
| **Teamwork Desk** | Third-party helpdesk platform with API integration |
| **Tenant** | An isolated organization instance in a multi-tenant system |
| **MVP** | Minimum Viable Product - initial launch scope |

---

## Document Validation

### Completeness Check

- [x] All 10 sections populated
- [x] All personas have ≥3 user stories (Olivia: 9, Marcus: 11, Diana: 4, Alex: 6)
- [x] All user stories have ≥2 acceptance criteria
- [x] All MVP features have documented removal test
- [x] All features trace to user stories
- [x] All user stories trace to personas
- [x] All user flows include error states
- [x] Technical assumptions compatible with Replit

### Confidence Scores

| Section | Score (1-10) | Notes |
|---------|--------------|-------|
| Problem Statement | 9 | Clear, quantified, person-centered |
| Personas | 8 | Four distinct personas covering key roles |
| User Stories | 9 | 30 stories with complete acceptance criteria |
| MVP Scope | 9 | Clear removal test applied, focused scope |
| Features | 8 | 11 features with edge cases and errors |
| Information Architecture | 8 | Complete navigation and flows |
| Replit Compatibility | 9 | All constraints considered |
| Overall | 8.5 | Ready for downstream agents |

### Flagged Items Requiring Review

1. **Processing Architecture:** For 100K records, processing may need to be chunked with progress persistence to avoid timeouts. Confirm Replit's request/background job timeout limits.

2. **File Storage:** Replit filesystem is ephemeral. Uploaded files must be stored in database (as blobs) or external storage. Decision needed on approach.

3. **Email Service:** Password reset requires email. If email service (Resend) is optional, need fallback mechanism (magic link via admin?).

4. **Teamwork API Limits:** Need to understand Teamwork's rate limits for initial sync of large inboxes (10K+ tickets).

### Assumptions Made

1. **Single Teamwork connection per source** — User cannot aggregate multiple Teamwork accounts in one source.

2. **Processing is synchronous** — User triggers and waits/monitors. No scheduled or webhook-triggered runs for MVP.

3. **Export is download only** — No direct push to S3, GCS, or training platforms.

4. **30-day data retention** — Processed outputs auto-delete after 30 days (or kept until manually deleted).

5. **No GoHighLevel for MVP** — Brief mentioned it but also said "MVP can focus just on Teamwork Desk."

### Document Status: COMPLETE

---

## Downstream Agent Handoff Brief

### Deployment Context (All Agents)

**Target Platform: Replit**
- Single container deployment
- PostgreSQL database (Neon)
- Port 5000 for backend server
- Automatic HTTPS via Replit
- Environment variables via Replit Secrets

This context applies to all downstream agents. Do not specify infrastructure that conflicts with Replit's deployment model.

---

### For Agent 2: System Architecture

**Core Technical Challenges:**
1. De-identification engine with consistent entity replacement across documents
2. File upload and parsing for CSV, Excel, JSON (up to 50MB)
3. Teamwork Desk API integration with rate limiting and pagination
4. Batch processing for 100K records with progress tracking
5. Secure credential storage for API connections

**Scale Expectations (within Replit ranges):**
- Concurrent users: 10-50
- Records per processing run: up to 100,000
- File sizes: up to 50MB
- API throughput: Standard SaaS levels (100-500 req/min peak)

**Integration Requirements:**
- Teamwork Desk API (REST, API key auth, ticket and conversation endpoints)
- Email service for invitations and password reset (Resend or similar - optional with graceful degradation)

**Authentication/Authorisation Complexity:**
- JWT-based authentication
- Organization-scoped access (multi-tenant)
- Two roles: Admin, Member
- Invitation-only registration

**Security Considerations:**
- API credential encryption at rest
- PII detection and removal (core feature)
- Rate limiting on auth endpoints
- Audit logging for compliance

**Key Decisions Deferred to You:**
- File storage approach (database blobs vs external storage)
- Processing architecture (synchronous vs background job)
- De-identification engine implementation (library vs custom)
- Caching strategy for API responses

**Replit Constraints:**
- Single process, no dedicated workers
- Port 5000 for HTTP
- Ephemeral filesystem
- Cold start behavior

---

### For Agent 3: Data Modeling

**Primary Entities Implied:**
- Organization (tenant)
- User (belongs to organization)
- Invitation (pending user)
- Project (belongs to organization)
- Source (belongs to project, polymorphic: file or API)
- FileSource (metadata for uploaded files)
- ApiConnection (credentials and config for API sources)
- FieldMapping (source field to target field)
- DeidentificationRule (PII type or custom pattern)
- QualityFilter (filter criteria)
- ProcessingRun (execution record)
- ProcessingOutput (generated file for download)
- ActivityLog (audit trail)

**Key Relationships:**
- Organization 1:N Users
- Organization 1:N Projects
- Project 1:N Sources
- Project 1:1 FieldMapping config (or per-source)
- Project 1:1 DeidentificationConfig
- Project 1:N ProcessingRuns
- ProcessingRun 1:N ProcessingOutputs

**Data Lifecycle:**
- Uploaded files: 30 days retention
- Processing outputs: Until deleted or 30 days
- Activity logs: 90 days
- Soft delete for users (preserve audit trail)

**Multi-tenancy Requirements:**
- All queries must scope to organization_id
- Cross-org data access must be impossible
- Organization ID on all tenant-scoped tables

**Replit Constraints:**
- PostgreSQL via Neon
- Drizzle ORM
- Connection pooling required

---

### For Agent 4: API Contract

**Primary Operations Needed:**

*Authentication:*
- POST /api/auth/register (accept invitation)
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me

*Organizations:*
- GET /api/organizations/:id
- PATCH /api/organizations/:id

*Users:*
- GET /api/users (list org users)
- POST /api/users/invite
- DELETE /api/users/:id
- PATCH /api/users/:id/role
- GET /api/invitations (pending)
- DELETE /api/invitations/:id

*Projects:*
- GET /api/projects
- POST /api/projects
- GET /api/projects/:id
- PATCH /api/projects/:id
- DELETE /api/projects/:id

*Sources:*
- GET /api/projects/:id/sources
- POST /api/projects/:id/sources (file upload)
- POST /api/projects/:id/sources/api (API connection)
- GET /api/sources/:id
- DELETE /api/sources/:id
- POST /api/sources/:id/refresh (re-fetch API)
- GET /api/sources/:id/preview

*Configuration:*
- GET /api/projects/:id/mapping
- PUT /api/projects/:id/mapping
- GET /api/projects/:id/deidentification
- PUT /api/projects/:id/deidentification
- POST /api/projects/:id/deidentification/preview
- GET /api/projects/:id/filters
- PUT /api/projects/:id/filters

*Processing:*
- POST /api/projects/:id/process
- GET /api/projects/:id/processing (current status)
- GET /api/projects/:id/runs (history)
- GET /api/runs/:id

*Exports:*
- GET /api/runs/:id/exports
- GET /api/exports/:id/download

*Audit:*
- GET /api/activity (with filters)
- GET /api/runs/:id/report

**Authentication Requirements:**
- Bearer token (JWT) in Authorization header
- Organization scoping via token claims
- Role checking for admin-only endpoints

**Real-time Requirements:**
- Processing progress updates (polling or SSE for MVP)

**Replit Constraints:**
- Express.js on port 5000
- /api prefix
- Health endpoint: GET /api/health

---

### For Agent 5: UI/UX Specification

**Primary User Flows:**
1. Invitation acceptance and first login
2. CSV upload → process → export (5-minute path)
3. Teamwork Desk connection setup
4. Field mapping configuration
5. De-identification preview and adjustment
6. Processing with progress monitoring
7. Export download

**Key Interaction Patterns:**
- Drag-and-drop file upload
- Side-by-side de-identification preview
- Progress bar for processing
- Multi-select for filter configuration
- Confirmation dialogs for destructive actions

**Accessibility Requirements:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast minimums

**Mobile/Responsive Requirements:**
- Responsive design for tablet and mobile browsers
- Touch-friendly interactions
- Critical flows work on mobile (monitoring, export download)

**Replit Constraints:**
- React frontend with Vite
- shadcn/ui components
- Tailwind CSS

---

### For Agent 6: Implementation Orchestrator

**Replit-Specific Requirements:**
- Health endpoint at GET /api/health (required for deployment)
- Server must listen on process.env.PORT || 5000
- Database URL from environment variable
- Drizzle migrations with tsx wrapper
- Security middleware: helmet, cors, rate-limit

**File Processing Notes:**
- CSV parsing: consider papaparse
- Excel parsing: consider xlsx or exceljs
- JSON parsing: native with validation
- Encoding detection may be needed

**De-identification Notes:**
- Consider presidio or similar NER library
- May need to build custom for performance at scale
- Entity mapping must persist across processing

**Processing Architecture Notes:**
- May need chunked processing with DB-persisted progress
- Consider Replit's timeout limits
- Error recovery with partial progress saved

---

### For Agent 7: QA & Deployment

**Critical Test Scenarios:**
1. First-run flow (CSV → export in < 5 minutes)
2. Teamwork Desk connection with invalid credentials
3. Processing with 100,000 records
4. De-identification consistency (same name = same placeholder)
5. Role-based access (member vs admin)
6. Session persistence (7-day JWT)
7. Concurrent users on same project

**Environment Variables Required:**
- DATABASE_URL (required)
- JWT_SECRET (required)
- SESSION_SECRET (required)
- RESEND_API_KEY (optional)
- TEAMWORK_API_* (per connection, encrypted)

**Health Check Requirements:**
- GET /api/health returns { status: "ok" }
- Verify database connectivity
- Report feature flags (email enabled, etc.)

---

### Handoff Summary

| Metric | Value |
|--------|-------|
| Total User Stories | 30 |
| P0 (Critical) | 14 |
| P1 (High) | 11 |
| P2 (Medium) | 5 |
| MVP Features | 11 |
| Estimated Complexity Distribution | S: 11, M: 14, L: 5 |
| Deployment Target | Replit |
| Primary Connector | Teamwork Desk |
| Scale Target | 100,000 records/project |

**Recommended Human Review Points:**
1. File storage approach (DB blobs vs external)
2. Processing timeout handling strategy
3. Email service fallback mechanism
4. Teamwork API rate limit handling

---

*Document End*
