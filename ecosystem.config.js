module.exports = {
  apps: [
    {
      name: 'poemquizzer-server',
      script: 'dist/index.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
