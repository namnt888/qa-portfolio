Feature: Ledger
  As a person tracking income and expenses
  I want the ledger to reflect what I record
  So that I can trust the balance

  Background:
    Given I am signed in

  Scenario: Expenses can be isolated from income
    When I filter the ledger by "expense"
    Then every visible row is an "expense"

  Scenario: A new expense appears at the top of the ledger
    When I add an expense of 100000 with note "Team lunch"
    Then the first row shows "100,000 ₫" with note "Team lunch"
