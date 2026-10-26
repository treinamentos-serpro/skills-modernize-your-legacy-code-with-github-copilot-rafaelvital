# Student Account Management

This COBOL example demonstrates a simple account-management flow for a student account. It maintains one account balance and supports viewing the balance, adding a credit, and making a debit. It does not store student names, IDs, or multiple accounts.

## Source Files

### `src/cobol/main.cob` - `MainProgram`

Runs the command-line menu and dispatches the user's selection to `Operations`:

- `1` calls `Operations` with `TOTAL` to display the current balance.
- `2` calls it with `CREDIT` to add funds.
- `3` calls it with `DEBIT` to subtract funds.
- `4` exits the menu loop.
- Any other selection displays an invalid-choice message.

### `src/cobol/operations.cob` - `Operations`

Implements the account actions. It reads the current balance from `DataProgram` before changing or displaying it, and writes the updated balance after a successful credit or debit. For credits and debits, it prompts for an amount and displays the result.

### `src/cobol/data.cob` - `DataProgram`

Provides a small in-memory balance store. Its `READ` operation copies the stored balance to the caller; `WRITE` replaces the stored balance with the value supplied by the caller. The balance starts at `1000.00` and remains available across calls while the program is running.

## Student Account Rules

- The example has one shared account balance, initialized to `1000.00`.
- A credit adds the entered amount to the balance and saves the result.
- A debit is allowed only when the current balance is greater than or equal to the entered amount. Otherwise, the balance is unchanged and an insufficient-funds message is displayed.
- Viewing the balance does not change it.
- The amount and balance fields use `PIC 9(6)V99`, representing up to six integer digits and two decimal digits with an implied decimal point.
- The balance is held in working storage, not persisted to a file or database; it returns to the initial value when the program starts again.
- The code does not identify students or implement separate accounts. It also has no explicit business validation for zero amounts, maximum balances, or arithmetic overflow.

## Application Data Flow

```mermaid
sequenceDiagram
actor User
participant Main as MainProgram
participant Ops as Operations
participant Data as DataProgram

loop Until the user exits
  Main->>User: Display menu
  User->>Main: Select an option

  alt View balance (1)
    Main->>Ops: TOTAL
    Ops->>Data: READ balance
    Data-->>Ops: Current balance
    Ops-->>User: Display current balance
  else Credit account (2)
    Main->>Ops: CREDIT
    Ops-->>User: Request credit amount
    User->>Ops: Enter amount
    Ops->>Data: READ balance
    Data-->>Ops: Current balance
    Note over Ops: Add amount to balance
    Ops->>Data: WRITE updated balance
    Data-->>Ops: Save balance
    Ops-->>User: Display confirmation and new balance
  else Debit account (3)
    Main->>Ops: DEBIT
    Ops-->>User: Request debit amount
    User->>Ops: Enter amount
    Ops->>Data: READ balance
    Data-->>Ops: Current balance
    alt Balance covers debit
      Note over Ops: Subtract amount from balance
      Ops->>Data: WRITE updated balance
      Data-->>Ops: Save balance
      Ops-->>User: Display confirmation and new balance
    else Insufficient funds
      Ops-->>User: Display insufficient-funds message
    end
  else Exit (4)
    Main->>Main: End menu loop
  else Invalid option
    Main-->>User: Display invalid-choice message
  end
end
```



