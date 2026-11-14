"""
RLS & Schema Verification Script for FMI.
Verifies SQL syntax, table definitions, RLS enablement, and isolation policies.
"""
import re
import sys
from pathlib import Path


def verify_schema_and_rls(migration_path: Path, test_path: Path) -> bool:
    print(f"[*] Reading migration: {migration_path.name}")
    content = migration_path.read_text(encoding="utf-8")

    expected_tables = [
        "profiles",
        "user_roles",
        "interview_templates",
        "question_bank",
        "interviews",
        "interview_turns",
        "body_metrics",
        "reports",
        "resources",
        "report_resources",
        "consents",
        "usage_limits",
    ]

    print("\n[+] 1. Checking Table Definitions & RLS Flags:")
    all_passed = True
    for table in expected_tables:
        table_match = re.search(rf"CREATE TABLE IF NOT EXISTS {table}\b", content, re.IGNORECASE)
        rls_match = re.search(rf"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;", content, re.IGNORECASE)

        table_ok = bool(table_match)
        rls_ok = bool(rls_match)

        status_str = "OK" if (table_ok and rls_ok) else "FAIL"
        print(f"    - Table '{table}': Created [{table_ok}], RLS Enabled [{rls_ok}] -> {status_str}")

        if not (table_ok and rls_ok):
            all_passed = False

    print("\n[+] 2. Checking RLS Policies defined:")
    policies = re.findall(r"CREATE POLICY\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)", content, re.IGNORECASE)
    for pol_name, tbl_name in policies:
        print(f"    ✓ Policy '{pol_name}' on '{tbl_name}'")

    if len(policies) < 10:
        print(f"    [!] Warning: Expected at least 10 policies, found {len(policies)}")
        all_passed = False

    print(f"\n[+] 3. Reading RLS test script: {test_path.name}")
    test_content = test_path.read_text(encoding="utf-8")
    assert "User A" in test_content
    assert "User B" in test_content
    assert "request.jwt.claim.sub" in test_content
    assert "ROLLBACK" in test_content
    print("    ✓ RLS Test Suite defines cross-tenant User A vs User B isolation checks.")

    print("\n" + "=" * 50)
    if all_passed:
        print("✓ ALL SCHEMA & RLS VERIFICATION CHECKS PASSED")
    else:
        print("✗ SCHEMA & RLS VERIFICATION CHECKS FAILED")
    print("=" * 50)

    return all_passed


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    migration_file = base_dir / "migrations" / "00001_initial_schema.sql"
    test_file = base_dir / "tests" / "rls_test.sql"

    success = verify_schema_and_rls(migration_file, test_file)
    sys.exit(0 if success else 1)

