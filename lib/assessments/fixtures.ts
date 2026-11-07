/**
 * SQL fixtures for SQL challenges. Each is a small, unfamiliar finance dataset loaded
 * into a fresh in-memory SQLite database for every run (scripts/sql-sandbox.mjs).
 * The schema text is shown to the learner; the data is not, so answers must be queried.
 */

export type Fixture = { id: string; title: string; schema: string; sql: string };

const RECON_SCHEMA = `accounts(account_id TEXT PK, name TEXT, currency TEXT)
ledger_entries(entry_id INTEGER PK, account_id TEXT → accounts, entry_date TEXT 'YYYY-MM-DD', amount REAL, reference TEXT NULL)
bank_lines(line_id INTEGER PK, account_id TEXT → accounts, value_date TEXT 'YYYY-MM-DD', amount REAL, reference TEXT NULL)
-- amount: positive = money in, negative = money out. A ledger entry and a bank line match
-- when account, amount and reference are equal.`;

const RECON_SQL = `
CREATE TABLE accounts (account_id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT NOT NULL);
CREATE TABLE ledger_entries (entry_id INTEGER PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(account_id),
  entry_date TEXT NOT NULL, amount REAL NOT NULL, reference TEXT);
CREATE TABLE bank_lines (line_id INTEGER PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(account_id),
  value_date TEXT NOT NULL, amount REAL NOT NULL, reference TEXT);
INSERT INTO accounts VALUES ('OPS-GBP','Operating account','GBP'),('OPS-EUR','Euro collections','EUR'),('PAY-GBP','Payroll account','GBP');
INSERT INTO ledger_entries VALUES
 (1,'OPS-GBP','2026-01-03', 1250.00,'INV-1001'),(2,'OPS-GBP','2026-01-05',-310.40,'SUP-77'),(3,'OPS-GBP','2026-01-09', 980.00,'INV-1002'),
 (4,'OPS-GBP','2026-01-14',-45.99,NULL),(5,'OPS-GBP','2026-01-20', 2200.00,'INV-1003'),(6,'OPS-GBP','2026-02-02',-1200.00,'RENT-FEB'),
 (7,'OPS-GBP','2026-02-11', 640.50,'INV-1004'),(8,'OPS-EUR','2026-01-07', 3100.00,'EU-501'),(9,'OPS-EUR','2026-01-21',-150.00,'FEE-01'),
 (10,'OPS-EUR','2026-02-04', 875.25,'EU-502'),(11,'OPS-EUR','2026-02-18', 1430.00,'EU-503'),(12,'PAY-GBP','2026-01-28',-8200.00,'PAYROLL-JAN'),
 (13,'PAY-GBP','2026-02-27',-8350.00,'PAYROLL-FEB'),(14,'OPS-GBP','2026-02-25',-89.00,'SUP-81');
INSERT INTO bank_lines VALUES
 (101,'OPS-GBP','2026-01-03', 1250.00,'INV-1001'),(102,'OPS-GBP','2026-01-06',-310.40,'SUP-77'),(103,'OPS-GBP','2026-01-10', 980.00,'INV-1002'),
 (104,'OPS-GBP','2026-01-14',-45.99,NULL),(105,'OPS-GBP','2026-01-22', 2000.00,'INV-1003'),(106,'OPS-GBP','2026-02-02',-1200.00,'RENT-FEB'),
 (107,'OPS-GBP','2026-02-13', 640.50,'INV-1004'),(108,'OPS-GBP','2026-02-16',-12.50,'BANK-CHG'),(109,'OPS-EUR','2026-01-08', 3100.00,'EU-501'),
 (110,'OPS-EUR','2026-01-21',-150.00,'FEE-01'),(111,'OPS-EUR','2026-02-05', 875.25,'EU-502'),(112,'PAY-GBP','2026-01-28',-8200.00,'PAYROLL-JAN'),
 (113,'PAY-GBP','2026-02-27',-8350.00,'PAYROLL-FEB'),(114,'OPS-EUR','2026-02-19', 95.00,'EU-INT');
`;

export const FIXTURES: Record<string, Fixture> = {
  recon: { id: "recon", title: "Bank reconciliation (three accounts, January–February 2026)", schema: RECON_SCHEMA, sql: RECON_SQL },
};
