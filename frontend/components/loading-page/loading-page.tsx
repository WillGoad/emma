import { LoadingSpinner } from "../loading-spinner/loading-spinner";

export const LoadingPage = () => {
  return (
    <div className="grid h-screen place-items-center">
      <LoadingSpinner />
    </div>
  );
};
