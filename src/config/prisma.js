const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: 'minimal',
});

// Connection test
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
