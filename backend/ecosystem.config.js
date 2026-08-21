module = {
  exports: {
    apps: [
      {
        name: 'das-crm-backend-cluster',
        script: 'dist/src/main.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: 3001,
        },
        max_memory_restart: '1G',
        kill_timeout: 5000,
        listen_timeout: 8000,
      },
    ],
  },
};
