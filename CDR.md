# DebtIQ — CDR / Open Banking scope decision (Phase 8)

**Decision: DebtIQ stays OUT of CDR scope. No CDR functionality is built.**

## Why

The Consumer Data Right (CDR / Open Banking) regulates the *accredited
receipt of consumer data via direct bank feeds*. DebtIQ's data model is
**document-upload + OCR**, not direct bank-feed ingestion:

- Borrowers (or brokers) **upload** payslips, statements and tax documents.
- Extraction runs via `/api/extract` (Claude vision) on those uploaded files.
- DebtIQ never connects to a bank's CDR endpoints and never receives CDR data.

Under this model, DebtIQ is **not** an Accredited Data Recipient and does not
collect CDR data, so CDR accreditation is not engaged today.

> **Source check (OAIC):** the OAIC confirms CDR "allows you to ask for your
> data to be securely transferred to an **accredited provider**." Because
> DebtIQ receives **uploaded documents** rather than CDR data transferred to it
> as an accredited provider, the out-of-scope position holds. (Premise verified
> from the OAIC overview; the operative accreditation rules remain
> `LEGAL-REVIEW`.)

## If direct bank feeds are ever pursued

Electing direct bank-feed ingestion would change this materially and is a
**gating project**, not a feature toggle:

- `LEGAL-REVIEW:` **CDR accreditation** (unrestricted / sponsored / CDR
  representative / Trusted Adviser pathways) must be obtained **before** any
  live CDR data flows. Building must not start live until accreditation is
  confirmed.
- `ARCH-REVIEW:` CDR data handling, consent management, data minimisation,
  dashboards, and the accredited-environment security controls would be a
  separate isolated subsystem (mirroring the Phase 7 ELNO adapter pattern:
  isolated adapter, mock-by-default, real connectivity human-enabled only).
- The existing document-upload path would remain the default and fallback.

## Status

Built nothing live (per the brief's conditional). This document records the
out-of-scope determination and the gating conditions if the position changes.
The determination itself is for qualified Australian counsel.
