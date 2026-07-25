const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Connect to database
const db = new sqlite3.Database('./erp.db');

// Read seed.sql file
const sql = fs.readFileSync('./seed.sql', 'utf8');

// Execute the SQL
db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Error importing seed data:', err.message);
    } else {
        console.log('✅ Seed data imported successfully!');
        console.log('📊 Added:');
        console.log('   - 20+ Customers');
        console.log('   - 25+ Products');
        console.log('   - 9+ Sales Challans');
        console.log('   - Stock movements');
        console.log('   - Follow-up notes');
    }
    db.close();
});