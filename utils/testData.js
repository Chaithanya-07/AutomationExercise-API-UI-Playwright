// utils/testData.js
//
// Generates unique test customer data so tests never depend on a
// hard-coded, possibly-deleted account and never collide with each other.
//
// The email embeds a timestamp: qa_user_<timestamp>@example.com
// The name embeds the same suffix so the UI assertion
// ("Logged in as <name>") can be matched against exact test data.

const birth_date = '15';
const birth_month = 'June';
const birth_year = '1995';

function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const email = `qa_user_${timestamp}${random}@example.com`;
  const name = `QA User ${timestamp.toString().slice(-5)}${random}`;

  return {
    // signup name + login email (what the UI "Logged in as ..." shows)
    name,
    email,
    password: 'Test@1234',

    // account information
    title: 'Mr', // 'Mr' or 'Mrs'
    birth_date,
    birth_month,
    birth_year,

    // address information
    firstname: 'QA',
    lastname: 'Tester',
    company: 'Test Automation Ltd',
    address1: '123 Test Street',
    address2: 'Apartment 4',
    country: 'India',
    zipcode: '500001',
    state: 'Telangana',
    city: 'Hyderabad',
    mobile_number: '9999999999',
  };
}

module.exports = { generateTestUser };