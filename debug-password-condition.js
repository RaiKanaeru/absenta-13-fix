// Test password condition logic
const password = 'testpassword123';

console.log('🔍 Testing password condition logic:');
console.log('Password:', password);
console.log('Type:', typeof password);
console.log('Length:', password.length);
console.log('Trim:', password.trim());
console.log('Trim length:', password.trim().length);
console.log('Truthy check:', !!password);
console.log('Condition 1:', password && password.trim() !== '');
console.log('Condition 2:', password && password.trim() !== '');

// Test with empty string
const emptyPassword = '';
console.log('\n🔍 Testing with empty password:');
console.log('Empty password:', emptyPassword);
console.log('Type:', typeof emptyPassword);
console.log('Length:', emptyPassword.length);
console.log('Trim:', emptyPassword.trim());
console.log('Trim length:', emptyPassword.trim().length);
console.log('Truthy check:', !!emptyPassword);
console.log('Condition 1:', emptyPassword && emptyPassword.trim() !== '');
console.log('Condition 2:', emptyPassword && emptyPassword.trim() !== '');

// Test with undefined
const undefinedPassword = undefined;
console.log('\n🔍 Testing with undefined password:');
console.log('Undefined password:', undefinedPassword);
console.log('Type:', typeof undefinedPassword);
console.log('Truthy check:', !!undefinedPassword);
console.log('Condition 1:', undefinedPassword && undefinedPassword.trim() !== '');
console.log('Condition 2:', undefinedPassword && undefinedPassword.trim() !== '');




