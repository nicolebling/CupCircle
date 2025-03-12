
// Check if database environment variables are properly set
console.log('Database URL environment variable is', process.env.DATABASE_URL ? 'set' : 'not set');

// Print a masked version of the URL for security (only showing the beginning)
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.substring(0, 15) + '...' + dbUrl.substring(dbUrl.lastIndexOf('@'));
  console.log('Database URL starts with:', maskedUrl);
}
