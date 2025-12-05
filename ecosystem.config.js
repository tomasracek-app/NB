module.exports = {
  apps: [
    {
      name: "klientska-platforma",
      script: "npm",
      args: "start",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: ".env.production",
    },
  ],
};
