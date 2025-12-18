module.exports = {
  development: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'csisp',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '5433'),
    dialect: 'postgres',
    timezone: '+08:00',
    logging: false,
    pool: { max: 20, min: 5, acquire: 30000, idle: 10000 },
  },
};
