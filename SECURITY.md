# Security Policy

## 1. Purpose and Scope

This Security Policy describes the processes, expectations, and best practices for identifying, reporting, and remediating security vulnerabilities in this public repository (“the Project”). The goal is to protect the integrity, confidentiality, and availability of the Project’s source code, dependencies, and deployed instances, while fostering an open, transparent, and collaborative approach to security.

This policy applies to all code, infrastructure-as-code, configuration files, and documentation in this repository, including the Java Spring Boot backend, React frontend, and associated utility libraries (e.g., Base64, GZIP, DSBmobile integration code). It addresses third-party contributions, dependency management, incident response, and responsible disclosure.

## 2. Reporting a Vulnerability

If you discover a potential security issue, please:

1. **Do not open a public issue.** Instead, send an email to our private security inbox at [security@zacklack.de](mailto:security@zacklack.de).
2. **Provide detailed information**: steps to reproduce, affected versions, severity assessment, proof-of-concept, and any suggested remediation.

We commit to:

* **Acknowledgment** within 48 hours.
* **Initial triage** and classification within 5 business days.
* **Resolution timeline**: patches or mitigations proposed within 30 days for critical flaws, 90 days for high/medium severity, and coordinated release for low-risk issues.

## 3. Supported Versions and Lifecycle

We maintain security support for the following release lines:

| Version | Supported Until   |
| ------- | ----------------- |
| `v1.x`  | December 31, 2025 |
| `v2.x`  | June 30, 2026     |
| `v3.x`  | December 31, 2026 |

After a version reaches end‑of‑support, no further security updates will be provided. Users are encouraged to upgrade to a supported version.

## 4. Severity Classification

We use a simplified CVSS-like scale:

* **Critical**: Remote code execution, authentication bypass, data exposure without user interaction.
* **High**: Privilege escalation, SQL/NoSQL injection, significant information disclosure.
* **Medium**: Cross-site scripting, moderate business logic flaws.
* **Low**: Minor configuration issues, information leakage with low impact.

## 5. Remediation Process

1. **Triage**: Confirm vulnerability, assign severity, identify root cause.
2. **Fix Development**: Create minimal patch, add test cases, update documentation.
3. **Code Review**: Peer review with at least two maintainers.
4. **Release**: Publish patched version, update changelog, notify affected users.
5. **CVE Assignment**: For Critical/High flaws, request CVE identifiers and include them in release notes.

## 6. Secure Development Practices

* **Credentials**: All secrets (API keys, database passwords) must be stored in environment variables or a secrets management system. No hard‑coded credentials in the codebase.
* **Dependency Management**: Regularly run dependency scanners (e.g., OWASP Dependency-Check, GitHub Dependabot). Update or patch vulnerable libraries promptly.
* **Static Analysis**: Integrate automated code scanning (SonarQube, SpotBugs) into CI pipeline for Java and frontend code.
* **Review and Testing**: All changes must pass unit, integration, and security tests before merge. Implement API rate‑limiting, input validation, and output encoding.
* **Transport Security**: Enforce HTTPS/TLS for all external and internal API calls. Reject insecure protocols.
* **Logging and Monitoring**: Sanitize logs to avoid sensitive data, maintain audit trails for authentication and privileged operations.

## 7. Incident Response

* **Detection**: Monitor error rates, unusual traffic patterns, and integrity checks.
* **Containment**: Isolate affected services, rotate compromised credentials, revoke tokens.
* **Eradication**: Remove malicious code, apply patches, validate fixes.
* **Recovery**: Restore services, perform regression testing, resume normal operations.
* **Post‑Mortem**: Document timeline, root cause, lessons learned, and corrective actions.

## 8. Third‑Party Contributions

By submitting a pull request, you confirm that:

1. You have the legal right to grant the Project the necessary license to your contributions.
2. Your code contains no known vulnerabilities, malware, or dependencies with incompatible licenses.
3. You follow this Security Policy and have not publicly disclosed any security issues prior to coordination.

All contributions are subject to security review and may be rejected or require changes before acceptance.

## 9. Disclosure Policy

We follow a **Coordinated Disclosure** approach:

* We will work with the reporter to develop and test a fix.
* We will not disclose technical details publicly until a patch is available.
* We will credit the reporter in release notes unless they request anonymity.

## 10. Acknowledgements

We appreciate the security community’s assistance in keeping this Project safe. Special thanks to all external researchers and maintainers. For questions regarding this policy, contact [security@zacklack.de](mailto:security@zacklack.de).

---

*Last updated: May 7, 2025*
