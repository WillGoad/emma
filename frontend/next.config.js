module.exports = {
    async rewrites() {
      return process.env.NODE_ENV === 'production'
        ? []
        : [
            {
              source: '/api/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
            }
          ];
    }
  };