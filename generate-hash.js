const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password hash for admin123:');
    console.log(hash);

    // Verify it works
    const isValid = await bcrypt.compare(password, hash);
    console.log('\\nHash is valid:', isValid);
}

generateHash();
