"use client";

import { useParams, useRouter } from "next/navigation";

const Page = () => {
  const params = useParams();

  return (
    <div>
      <h1>Organisation</h1>
      <p>Objectid: {params.objectid}</p>
    </div>
  );
};

export default Page;
