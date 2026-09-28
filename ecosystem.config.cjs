module.exports = {
  apps: [
    {
      name: 'formbar-app',
      cwd: __dirname,
      script: 'src/server.js',
      interpreter: 'node',
      instances: process.env.WEB_CONCURRENCY || 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 8000,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        WEB_CONCURRENCY: '1',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
