"use client";

import { useParams, useRouter } from "next/navigation";

const Page = () => {
  const params = useParams();

  return (
    <div>
      <h1>Data Product</h1>
      <p>Objectid: {params.objectId}</p>
    </div>
  );
};

export default Page;
