import { db } from './db.js';

async function testServerStartup() {
    console.log('🧪 Testing server startup components...');
    
    try {
        // Test database connection
        console.log('📡 Testing database connection...');
        await db.getConnection();
        console.log('✅ Database connection: OK');
        
        // Test basic imports
        console.log('📦 Testing imports...');
        const express = await import('express');
        console.log('✅ Express import: OK');
        
        const mysql = await import('mysql2/promise');
        console.log('✅ MySQL2 import: OK');
        
        const bcrypt = await import('bcrypt');
        console.log('✅ Bcrypt import: OK');
        
        const jwt = await import('jsonwebtoken');
        console.log('✅ JWT import: OK');
        
        console.log('✅ All basic imports successful');
        
        // Test server creation
        console.log('🚀 Testing server creation...');
        const app = express.default();
        app.get('/test', (req, res) => {
            res.json({ success: true, message: 'Server is working' });
        });
        
        const server = app.listen(3002, () => {
            console.log('✅ Test server started on port 3002');
            server.close(() => {
                console.log('✅ Test server closed');
            });
        });
        
    } catch (error) {
        console.error('❌ Error during startup test:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    } finally {
        await db.close();
        console.log('🔌 Database connection closed');
    }
}

testServerStartup().catch(console.error);

