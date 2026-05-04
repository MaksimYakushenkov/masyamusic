module.exports = {
  apps: [
    {
      name: 'masyamusic',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3028,
      },
    },
  ],
}
