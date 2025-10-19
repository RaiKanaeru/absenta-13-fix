#!/bin/bash

# ABSENTA Redis Connection Ultimate Fix
# Script lengkap untuk mengatasi masalah Redis di Ubuntu 22 + aaPanel

echo "🔧 ABSENTA REDIS ULTIMATE FIX"
echo "============================"
echo "Fixing 'redis': 'not configured' issue"
echo ""

# Function to check if Redis is responding
check_redis() {
    if redis-cli ping >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to test Node.js Redis connection
test_nodejs_redis() {
    cat > /tmp/redis_test.mjs << 'EOF'
import Redis from 'ioredis';
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    lazyConnect: true,
    maxRetriesPerRequest: 3
});
try {
    await redis.ping();
    console.log('SUCCESS');
    await redis.quit();
} catch (e) {
    console.log('FAILED');
}
EOF
    
    if node /tmp/redis_test.mjs 2>/dev/null | grep -q "SUCCESS"; then
        rm -f /tmp/redis_test.mjs
        return 0
    else
        rm -f /tmp/redis_test.mjs
        return 1
    fi
}

# STEP 1: Install and configure Redis
echo "1. 🚀 Setting up Redis..."
if ! command -v redis-cli >/dev/null 2>&1; then
    echo "   Installing Redis..."
    sudo apt update >/dev/null 2>&1
    sudo apt install -y redis-server >/dev/null 2>&1
fi

# Start Redis service
sudo systemctl start redis-server >/dev/null 2>&1
sudo systemctl enable redis-server >/dev/null 2>&1
sleep 3

if check_redis; then
    echo "   ✅ Redis server is running"
else
    echo "   ❌ Redis failed to start. Trying alternative config..."
    
    # Try to fix Redis configuration
    sudo tee /etc/redis/redis.conf.backup > /dev/null << 'EOF'
# Basic Redis configuration for ABSENTA
bind 127.0.0.1
port 6379
timeout 0
save 900 1
save 300 10
save 60 10000
rdbcompression yes
dbfilename dump.rdb
dir /var/lib/redis
maxmemory-policy allkeys-lru
EOF
    
    sudo systemctl restart redis-server >/dev/null 2>&1
    sleep 5
    
    if check_redis; then
        echo "   ✅ Redis fixed and running"
    else
        echo "   ❌ Redis still not working. Manual intervention needed."
        exit 1
    fi
fi

# STEP 2: Install Node.js Redis client
echo "2. 📦 Setting up Node.js Redis client..."
if [ -f "package.json" ]; then
    if ! npm list ioredis >/dev/null 2>&1; then
        echo "   Installing ioredis..."
        npm install ioredis >/dev/null 2>&1
    fi
    echo "   ✅ ioredis is available"
else
    echo "   ❌ package.json not found"
fi

# Test Node.js Redis connection
if test_nodejs_redis; then
    echo "   ✅ Node.js can connect to Redis"
else
    echo "   ❌ Node.js cannot connect to Redis"
fi

# STEP 3: Fix application Redis connection
echo "3. 🔧 Fixing application Redis connection..."

# Check if we need to add Redis global reference
if ! grep -q "global.redis" server_modern.js; then
    echo "   Adding global Redis reference..."
    
    # Find where cacheSystem is initialized and add Redis global reference
    if grep -n "global.cacheSystem = cacheSystem" server_modern.js >/dev/null; then
        LINE_NUM=$(grep -n "global.cacheSystem = cacheSystem" server_modern.js | head -1 | cut -d: -f1)
        
        # Create backup
        cp server_modern.js server_modern.js.backup-redis-$(date +%s)
        
        # Add Redis global reference after cacheSystem
        sed -i "${LINE_NUM}a\\        global.redis = cacheSystem.redis; // Redis connection for status endpoint" server_modern.js
        echo "   ✅ Added global.redis reference"
    fi
fi

# STEP 4: Ensure status endpoint exists and is correct
echo "4. 📡 Ensuring status endpoint exists..."

if ! grep -q "'/api/status'" server_modern.js; then
    echo "   Adding /api/status endpoint..."
    
    # Create the status endpoint
    cat > /tmp/status_endpoint.js << 'EOF'

// Server status endpoint for monitoring
app.get('/api/status', (req, res) => {
    try {
        const uptime = process.uptime();
        
        // Check Redis status properly
        let redisStatus = 'not configured';
        
        // Try multiple ways to check Redis status
        if (global.redis) {
            if (global.redis.status === 'ready' || global.redis.status === 'connect') {
                redisStatus = 'connected';
            }
        } else if (global.cacheSystem && global.cacheSystem.isConnected) {
            redisStatus = 'connected';
        } else if (global.cacheSystem && global.cacheSystem.redis) {
            try {
                if (global.cacheSystem.redis.status === 'ready') {
                    redisStatus = 'connected';
                }
            } catch (e) {
                redisStatus = 'not configured';
            }
        }
        
        res.json({
            server: "ABSENTA Backend API",
            version: "1.0.0",
            status: "running",
            timestamp: new Date().toISOString(),
            uptime: uptime,
            port: 3001,
            environment: "development",
            database: global.dbPool ? "connected" : "disconnected",
            redis: redisStatus,
            features: {
                authentication: true,
                attendance: true,
                reports: true,
                backup: true,
                monitoring: true
            }
        });
    } catch (error) {
        res.status(500).json({
            server: "ABSENTA Backend API",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

EOF
    
    # Find insertion point - after middleware setup
    if grep -n "app.use.*express.json" server_modern.js >/dev/null; then
        LINE_NUM=$(grep -n "app.use.*express.json" server_modern.js | tail -1 | cut -d: -f1)
        LINE_NUM=$((LINE_NUM + 3))
        
        # Insert the endpoint
        head -n $LINE_NUM server_modern.js > /tmp/temp_server.js
        cat /tmp/status_endpoint.js >> /tmp/temp_server.js
        tail -n +$((LINE_NUM + 1)) server_modern.js >> /tmp/temp_server.js
        
        mv /tmp/temp_server.js server_modern.js
        echo "   ✅ Status endpoint added"
    fi
    
    rm -f /tmp/status_endpoint.js
fi

# STEP 5: Update Redis connection in initializeDatabase function
echo "5. 🔄 Updating Redis initialization..."

# Look for cacheSystem initialization and ensure global.redis is set
if grep -n "await cacheSystem.initialize()" server_modern.js >/dev/null; then
    # Check if global.redis assignment exists after cacheSystem init
    if ! grep -A 5 "await cacheSystem.initialize()" server_modern.js | grep -q "global.redis"; then
        echo "   Adding Redis global assignment..."
        
        LINE_NUM=$(grep -n "await cacheSystem.initialize()" server_modern.js | head -1 | cut -d: -f1)
        
        # Add Redis assignment after cacheSystem initialization
        sed -i "${LINE_NUM}a\\        global.redis = cacheSystem.redis;" server_modern.js
        echo "   ✅ Redis global assignment added"
    fi
fi

# STEP 6: Validate JavaScript syntax
echo "6. ✅ Validating JavaScript syntax..."
if node -c server_modern.js 2>/dev/null; then
    echo "   ✅ JavaScript syntax is valid"
else
    echo "   ❌ JavaScript syntax error. Restoring backup..."
    cp server_modern.js.backup-redis-* server_modern.js 2>/dev/null || echo "   No backup found"
fi

# STEP 7: Restart application
echo "7. 🔄 Restarting application..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart absenta-backend --update-env >/dev/null 2>&1
    echo "   ✅ Application restarted"
    
    # Wait for app to start
    echo "   ⏱️ Waiting for application to initialize..."
    sleep 10
else
    echo "   ⚠️ PM2 not found"
fi

# STEP 8: Test the fix
echo "8. 🧪 Testing the fix..."

# Test Redis directly
if check_redis; then
    echo "   ✅ Redis server responding"
else
    echo "   ❌ Redis server not responding"
fi

# Test API endpoint
sleep 5
API_RESPONSE=$(curl -s http://localhost:3001/api/status 2>/dev/null || echo "FAILED")

if [ "$API_RESPONSE" = "FAILED" ]; then
    echo "   ❌ API not responding"
else
    echo "   ✅ API responding"
    
    # Check Redis status in API response
    REDIS_STATUS=$(echo "$API_RESPONSE" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4 2>/dev/null)
    echo "   📊 Redis status: $REDIS_STATUS"
    
    if [ "$REDIS_STATUS" = "connected" ]; then
        echo "   🎉 SUCCESS! Redis is now connected!"
    else
        echo "   ⚠️ Redis still showing as: $REDIS_STATUS"
    fi
fi

# Test external API
echo "9. 🌍 Testing external API..."
EXTERNAL_RESPONSE=$(curl -s https://api.raikanaeru.my.id/api/status 2>/dev/null || echo "FAILED")
if [ "$EXTERNAL_RESPONSE" = "FAILED" ]; then
    echo "   ❌ External API not accessible"
else
    EXTERNAL_REDIS=$(echo "$EXTERNAL_RESPONSE" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4 2>/dev/null)
    echo "   📊 External Redis status: $EXTERNAL_REDIS"
fi

# FINAL REPORT
echo ""
echo "📋 FINAL REPORT"
echo "==============="

if [ "$REDIS_STATUS" = "connected" ]; then
    echo "🎉 REDIS CONNECTION SUCCESSFULLY FIXED!"
    echo "✅ Redis server: Running"
    echo "✅ Node.js Redis client: Connected"
    echo "✅ Application Redis status: Connected"
    echo ""
    echo "🔗 Test URL: http://localhost:3001/api/status"
    echo "🔗 External URL: https://api.raikanaeru.my.id/api/status"
else
    echo "⚠️ REDIS CONNECTION STILL HAS ISSUES"
    echo "📋 Current status:"
    echo "   Redis server: $(check_redis && echo "Running" || echo "Not running")"
    echo "   API Redis status: $REDIS_STATUS"
    echo ""
    echo "🔧 Additional steps needed:"
    echo "1. Check application logs: pm2 logs absenta-backend"
    echo "2. Verify Redis configuration in code"
    echo "3. Check for Redis connection errors in logs"
fi

echo ""
echo "📋 VERIFICATION COMMANDS:"
echo "redis-cli ping"
echo "curl http://localhost:3001/api/status | jq"
echo "pm2 logs absenta-backend --lines 10"