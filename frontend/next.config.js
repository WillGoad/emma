// next.config.js
module.exports = {
  images: {
    domains: ['logo.clearbit.com'], // Add the required domain here
  },
    async rewrites() {
      return process.env.NODE_ENV === 'development' ? [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
        }
      ] : [];
    }
  };