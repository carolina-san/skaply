module.exports = {
  apps: [
    {
      name: "lynk_backend",
      script: "./dist/index.js", 
      exec_mode: "fork",         
      instances: 1,              
      autorestart: true,
      watch: false,
      ignore_watch: ["node_modules", ".git"],

      // Get .env variables from .env file
      env_production: {
        NODE_ENV: "production",
        env_file: ".env",
      },
    },
  ],
};