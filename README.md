# AccessLease

**Temporary access. Lasting accountability.**

An interactive prototype for Code-e-Manipal PS18: finding temporary permissions that never expired. Uses only fictional institutional data; never connects to real institutional accounts.

## Run locally

Requires Python 3 for serving and Node.js 18+ for tests. No npm dependencies or build step.

```sh
python3 -m http.server 3000
# Open http://localhost:3000
node --test engine.test.js
```

Deploy this repository to Vercel using framework **Other**, no build command, and output directory `.`. `vercel.json` includes these settings and response security headers. The entry point is `index.html`.

## Demo story

1. Open Overview and run the access audit. The sample starts on 15 October 2026 with eight grants, ten effective identity/resource paths, three confirmed violations and six metadata/policy review findings.
2. Open the review queue and inspect G-101. The fellowship's role access expired on 30 September, but remains active for Maya and Nikhil.
3. Add a decision reason and simulate revocation. Nikhil loses archive access; Maya retains her separate G-108 direct grant. Review the map and audit trail.
4. Advance the simulated clock by seven days. G-105 now breaches its expiry boundary. Renew with a documented reason or revoke it.
5. Revoke G-106 to demonstrate how a separately active delegation (G-107) is flagged, rather than silently removed.
6. Export the audit report or journal as JSON. Download the sample dataset from Access inventory to inspect/import the schema.

## Implemented

- Responsive dark dashboard and interactive SVG access map; keyboard-accessible resource nodes.
- Direct grants, role membership expansion, delegated grants and ancestor-chain validation.
- Evidence-backed stale and excessive-scope findings, sorted by deterministic priority.
- Separate review findings for missing owner, purpose, expiry or applicable policy.
- Reviewer notes; simulated revoke, expiry, metadata and permission-scope actions.
- Recomputed findings and effective paths after every change; independent paths stay effective.
- Date simulation, JSON dataset validation/import, sample download and report/journal export.
- Browser-local persistence with before/after records, timestamps and decision reasons.
- ECDSA-signed event manifest with public-key verification, SHA-256 dataset fingerprint and a hash-linked journal.\n- Offline manifest verifier and a tamper demo that proves altered evidence fails verification.
- Reduced-motion support, modal focus management and escaped imported text.

## Data contract

Export the sample JSON in the UI for a complete example. Top-level collections are `identities`, `roles`, `resources`, `grants` and `policy`.

- Identity: `id`, `name`, `type`.
- Role: `id`, `name`, `members` (identity IDs).
- Resource: `id`, `name`, `sensitivity` (`Medium`, `High`, `Critical`).
- Policy: `id`, optional `name`, `rules` with `type`, `resource`, `allowed` permissions.
- Grant: `id`, `subject`, `subjectType` (`identity` or `role`), `resource`, `permissions`, `owner`, `purpose`, `expires` (`YYYY-MM-DD` or null), `status` (`active` or `revoked`), optional `delegatedFrom` grant ID.
- Permissions: explicit strings `read`, `write`, `admin`; there is no implicit permission hierarchy.
- Unique rule per identity type/resource pair. No wildcard policies, nested roles, or group memberships beyond explicit role members.
- Imports up to 1 MB; up to 200 entries per primary collection, 500 policy rules. Graph limits displayed nodes to preserve readability; all grants are evaluated and listed.

## Semantics and limitations

Expiry is inclusive at 00:00 UTC on the recorded date. An active grant past expiry is a policy violation but remains effective until explicitly revoked: detecting this gap is the purpose of the tool. Missing metadata is uncertainty, not proof. Grant expiry renewal does not automatically fix excess scope or missing owners. Delegation must remain within every ancestor's resource, scope and expiry; revoked/expired ancestors are violations. The dataset treats a delegation record as an assertion of its source; it does not authenticate the delegator or verify real-world delegation authority.

The priority formula is documented in Policy library. Open Integrity & manifest to create a signed evidence package, upload and verify it independently, or run the tamper demonstration. The app computes findings immediately; “Run access audit” records an explicit evaluation snapshot. A review note records the decision without hiding an unresolved finding.

This is a browser-local, single-reviewer demonstration, not a production IAM system. Persistence uses localStorage; sessions do not synchronize between users or devices. Audit records are inspectable and exportable. The signed manifest provides tamper-evident evidence for the exported snapshot; its private key is session-local and browser storage itself is not tamper-proof. No login, real revocation, AI service, secret, external dependency, or server database is used. Use mock data only. Reset clears local state after confirmation. Imports preserve journal entries and record the old and new dataset.

## Structure

- `engine.js`: pure validation, effective-access expansion, policy checks and review mutations.
- `app.js`: presentation, interactions, import/export and local session persistence.
- `style.css`, `index.html`: responsive interface.
- `engine.test.js`: boundary, policy, role, delegation, import and review tests.

Built for a clear demonstration: show the evidence, make a decision, verify the remaining access.

## Mentor-guided access lifecycle (v2)

The homepage now includes public resources, a student request portal, and an organisation control centre. The same lifecycle control centre is embedded in the full organisation workspace. Its state is separate from the original legacy audit dataset, which remains available below it.

- Public handbook; three fictional protected resources with read-only scope.
- Purpose-based requests and reviewer decisions with mandatory reasons.
- Approval durations of 1 minute, 5 minutes, 1 hour or 24 hours, never exceeding the requested duration.
- Deadline enforcement on every simulated resource read, independent of normal expiry cleanup.
- Inactivity suspension (30 seconds, 2 minutes or 5 minutes); manual suspension/revocation; blocked resumed activity.
- Live countdown, closing open resource dialogs after permission ends, cross-tab request/sign-in/block alerts, and JSON activity export.
- Failure lab: skip normal expiry cleanup, advance demo time and verify the independent check still denies access.

### Presentation walkthrough

1. Open public resources and read the handbook without approval.
2. Open the student demo and request the research archive for 1 minute, with a purpose.
3. In another tab on the **same origin**, open the organisation demo or full workspace. Approve for 1 minute with a 2-minute inactivity limit and a decision reason.
4. Return to the student tab and open the archive; the allowed read appears in the activity trail.
5. In the organisation tab enable **Simulate expiry-cleanup failure**, then **Advance 61 seconds**.
6. Try the archive again: the independent deadline check blocks it and records an alert, even though cleanup left the lease active.
7. For an inactivity demonstration, approve a new 5-minute request with a 30-second inactivity limit, advance 61 seconds, and attempt access again.

### Boundary of this implementation

This is still a **browser-local simulation**, not an authenticated or server-enforced system. It does not connect to Azure/Entra ID, invalidate real tokens, or protect real files. All sample content is public source code. Role selection is a demonstration, not authentication. localStorage is editable and not transactional across simultaneous tab writes; use sequential actions for the demonstration. Notifications synchronise only between tabs on the same browser profile and origin, not between devices. The policy clock's high-water mark is a demo convenience, not a trusted time source. A real implementation needs verified identities and reviewer roles, authoritative server time and storage, permission checks at the resource boundary, immutable central logs and authorised provider integrations. Browser code cannot make those guarantees.

Lifecycle sources: `lease-engine.js`, `lease-store.js`, `lease-ui.js`, `lease.css`, `lease-engine.test.js`. Run `npm test` for both policy models.
