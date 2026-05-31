module.exports = {
  apps: [
    {
      name: 'superapp',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
