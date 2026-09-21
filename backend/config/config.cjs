// Load environment variables from the .env file
require("dotenv").config();

// Export database configurations for Sequelize CLI
module.exports = {
  // Configuration for local development
  development: {
    username: process.env.DB_USER, // PostgreSQL username
    password: process.env.DB_PASSWORD, // PostgreSQL password
    database: process.env.DB_NAME, // Database name
    host: process.env.DB_HOST, // Database server address
    port: process.env.DB_PORT, // PostgreSQL port
    dialect: "postgres", // Database system being used
  },

  // Configuration for automated tests
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
  },

  // Configuration for the live application
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
  },
};