'use strict';

const readline = require('node:readline');

const MAX_BALANCE = 99999999;
const MENU = [
  '--------------------------------',
  'Account Management System',
  '1. View Balance',
  '2. Credit Account',
  '3. Debit Account',
  '4. Exit',
  '--------------------------------',
  'Enter your choice (1-4): ',
].join('\n');

function parseAmount(input) {
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) {
    return null;
  }

  return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
}

function formatBalance(cents) {
  // Preserve COBOL PIC 9(6)V99 output: eight digits, implied decimal point.
  return String(cents).padStart(8, '0');
}

async function main() {
  let balance = 100000;
  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const lines = input[Symbol.asyncIterator]();

  try {
    while (true) {
      console.log(MENU);
      const choice = await lines.next();
      if (choice.done || choice.value.trim() === '4') {
        break;
      }

      switch (choice.value.trim()) {
        case '1':
          console.log(`Current balance: ${formatBalance(balance)}`);
          break;
        case '2':
        case '3': {
          const credit = choice.value.trim() === '2';
          console.log(credit ? 'Enter credit amount: ' : 'Enter debit amount: ');
          const answer = await lines.next();
          if (answer.done) {
            console.log('No amount received. Transaction cancelled.');
            return;
          }

          const amount = parseAmount(answer.value);
          if (amount === null) {
            console.log('Invalid amount. Enter 0 through 999999.99 with up to two decimal places.');
            break;
          }

          if (credit) {
            if (balance + amount > MAX_BALANCE) {
              console.log('Credit would exceed the maximum balance of 999999.99.');
              break;
            }
            balance += amount;
            console.log(`Amount credited. New balance: ${formatBalance(balance)}`);
          } else if (balance >= amount) {
            balance -= amount;
            console.log(`Amount debited. New balance: ${formatBalance(balance)}`);
          } else {
            console.log('Insufficient funds for this debit.');
          }
          break;
        }
        default:
          console.log('Invalid choice, please select 1-4.');
      }
    }
  } finally {
    input.close();
    console.log('Exiting the program. Goodbye!');
  }
}

main().catch((error) => {
  console.error('Account management failed:', error);
  process.exitCode = 1;
});
