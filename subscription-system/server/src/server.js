require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');
const app = require('./app');
const { initDb } = require('./config/db');
const { initBillingCron } = require('./jobs/cron');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('⚡ Initializing Brightloop Subscription Core Server...');
    await initDb();
    
    // Start automated recurring billing background job
    initBillingCron();

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`🩺 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to boot up server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
