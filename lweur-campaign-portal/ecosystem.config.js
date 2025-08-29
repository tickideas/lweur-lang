module.exports = {
  apps: [
    {
      name: 'lweur-campaign-portal',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/path/to/lweur-campaign-portal', // Update this to your actual deployment path
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/lweur-campaign-portal/error.log',
      out_file: '/var/log/lweur-campaign-portal/out.log',
      log_file: '/var/log/lweur-campaign-portal/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your.production.server.com'], // Update with your server IP/domain
      ref: 'origin/main',
      repo: 'https://github.com/your-org/lweur-campaign-portal.git', // Update with your repo
      path: '/home/deploy/lweur-campaign-portal',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run db:generate && npm run db:migrate && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    },
  },
}