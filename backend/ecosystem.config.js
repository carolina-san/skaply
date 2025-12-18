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
        DB_HOST:"localhost",
        DB_PORT:"5432",
        DB_NAME:"skaplyDB",
        DB_USER:"lynk",
        DB_PASSWORD:"3vh6CR1&?22",
        JWT_SECRET:"your_jwt_secret_key",
        JWT_EXPIRES_IN:"24h",
        API_VERSION:"v1"
      },
    },
  ],
};