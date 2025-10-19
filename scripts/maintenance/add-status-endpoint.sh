#!/bin/bash

# Script untuk menambahkan endpoint /api/status ke server_modern.js
# Ini akan mengatasi masalah "redis": "not configured"

echo "🔧 Adding /api/status endpoint to ABSENTA server"
echo "=============================================="

# Backup original file
cp server_modern.js server_modern.js.backup-$(date +%s)
echo "✅ Backup created: server_modern.js.backup-$(date +%s)"

# Cek apakah endpoint /api/status sudah ada
if grep -q "'/api/status'" server_modern.js; then
    echo "⚠️ /api/status endpoint already exists"
else
    echo "📝 Adding /api/status endpoint..."
    
    # Find a good place to insert the endpoint (after middleware setup, before other endpoints)
    # Look for a line with "// ================================================"
    # or insert after app.use statements
    
    # Create temporary file with new endpoint
    cat > temp_status_endpoint.js << 'EOF'

// ================================================
// SERVER STATUS ENDPOINT
// ================================================

// Server status endpoint
app.get('/api/status', (req, res) => {
    try {
        const uptime = process.uptime();
        const timestamp = new Date().toISOString();
        
        // Check Redis status
        let redisStatus = 'not configured';
        if (global.redis) {
            try {
                if (global.redis.status === 'ready' || global.redis.status === 'connect') {
                    redisStatus = 'connected';
                } else if (global.redis.status === 'connecting') {
                    redisStatus = 'connecting';
                } else {
                    redisStatus = 'not configured';
                }
            } catch (error) {
                redisStatus = 'not configured';
            }
        } else if (global.cacheSystem && global.cacheSystem.isConnected) {
            redisStatus = 'connected';
        }
        
        // Check database status
        let databaseStatus = 'disconnected';
        if (global.dbPool) {
            databaseStatus = 'connected';
        }
        
        const statusResponse = {
            server: "ABSENTA Backend API",
            version: "1.0.0",
            status: "running",
            timestamp: timestamp,
            uptime: uptime,
            port: 3001,
            environment: "development",
            database: databaseStatus,
            redis: redisStatus,
            features: {
                authentication: true,
                attendance: true,
                reports: true,
                backup: true,
                monitoring: true
            }
        };
        
        res.json(statusResponse);
        
    } catch (error) {
        console.error('❌ Error in status endpoint:', error);
        res.status(500).json({
            server: "ABSENTA Backend API",
            version: "1.0.0",
            status: "error",
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

EOF
    
    # Find the right place to insert the endpoint
    # Look for the first occurrence of a section header or after middleware setup
    
    if grep -n "// ================================================" server_modern.js | head -1; then
        # Insert after the first section header
        LINE_NUM=$(grep -n "// ================================================" server_modern.js | head -1 | cut -d: -f1)
        echo "📍 Inserting status endpoint after line $LINE_NUM"
        
        # Split file and insert new content
        head -n $LINE_NUM server_modern.js > temp_server_part1.js
        cat temp_status_endpoint.js >> temp_server_part1.js
        tail -n +$((LINE_NUM + 1)) server_modern.js >> temp_server_part1.js
        
        # Replace original file
        mv temp_server_part1.js server_modern.js
        
    else
        # Fallback: insert after app.use statements
        if grep -n "app.use.*cookieParser" server_modern.js; then
            LINE_NUM=$(grep -n "app.use.*cookieParser" server_modern.js | tail -1 | cut -d: -f1)
            LINE_NUM=$((LINE_NUM + 1))
            echo "📍 Inserting status endpoint after cookieParser (line $LINE_NUM)"
            
            head -n $LINE_NUM server_modern.js > temp_server_part1.js
            cat temp_status_endpoint.js >> temp_server_part1.js
            tail -n +$((LINE_NUM + 1)) server_modern.js >> temp_server_part1.js
            
            mv temp_server_part1.js server_modern.js
        else
            echo "❌ Could not find suitable insertion point"
            echo "💡 Please add the endpoint manually"
            cat temp_status_endpoint.js
        fi
    fi
    
    # Clean up temp files
    rm -f temp_status_endpoint.js temp_server_part1.js
    
    echo "✅ Status endpoint added successfully"
fi

# Verify the endpoint was added
if grep -q "'/api/status'" server_modern.js; then
    echo "✅ /api/status endpoint found in server_modern.js"
else
    echo "❌ Failed to add /api/status endpoint"
fi

echo ""
echo "🔧 Now we need to ensure Redis connection is properly set up..."

# Check if Redis connection is properly initialized
if grep -q "global.redis" server_modern.js; then
    echo "✅ global.redis references found"
else
    echo "⚠️ No global.redis found, will use cacheSystem instead"
fi

# Check if cacheSystem is connected to Redis
if grep -q "global.cacheSystem" server_modern.js; then
    echo "✅ global.cacheSystem references found"
else
    echo "⚠️ No global.cacheSystem found"
fi

echo ""
echo "📋 Next steps:"
echo "1. Restart the application: pm2 restart absenta-backend"
echo "2. Test the endpoint: curl http://localhost:3001/api/status"
echo "3. If Redis still shows 'not configured', check Redis connection in the app"

echo ""
echo "🧪 Testing syntax..."
if node -c server_modern.js; then
    echo "✅ JavaScript syntax is valid"
else
    echo "❌ JavaScript syntax error detected"
    echo "Restoring backup..."
    cp server_modern.js.backup-* server_modern.js 2>/dev/null
fi