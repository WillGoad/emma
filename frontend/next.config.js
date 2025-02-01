// next.config.js
module.exports = {
    async rewrites() {
      return process.env.NODE_ENV === 'development' ? [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*'
        }
      ] : [];
    }
  };