export default {
  connection: {
    connectionString: process.env.DATABASE_URL,
  },
  outputPath: 'src/db-types/generated',
  customTypeMap: {},
};
