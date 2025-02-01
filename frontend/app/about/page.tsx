import React from "react";

const AboutPage = () => {
  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-start p-24 gap-4">
        <h1 className="font-bold">The marketplace for stock exchange data</h1>
        <ul>
          <li>
            One-click access to data from 90% of developing market exchanges.
          </li>
          <li>Exchanges gain access to multiple buyers for a 5% fee.</li>
          <li>
            Transparent pricing, usage tracking, and standardized data through
            engineer-friendly APIs.
          </li>
        </ul>
      </main>
    </div>
  );
};

export default AboutPage;
