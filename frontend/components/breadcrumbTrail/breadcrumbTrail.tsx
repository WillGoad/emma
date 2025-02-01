import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { breadcrumbLocation } from "@/lib/types";
import Link from "next/link";

interface BreadcrumbFactoryProps {
  baseURL: string;
  breadcrumbTree: breadcrumbLocation;
  setLocation: (locationId: string) => void;
}

// Will either end the breadcrumb trail or continue it if more children

const BreadcrumbBranch = ({
  baseURL,
  breadcrumbTree,
  setLocation,
}: BreadcrumbFactoryProps): JSX.Element => {
  if (breadcrumbTree.child) {
    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href={baseURL + "?view=" + breadcrumbTree.id}
              onClick={() => setLocation(breadcrumbTree.id)}
            >
              {breadcrumbTree.label}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbBranch
          baseURL={baseURL}
          breadcrumbTree={breadcrumbTree.child}
          setLocation={setLocation}
        />
      </>
    );
  }
  return (
    <BreadcrumbItem>
      <BreadcrumbPage onClick={() => setLocation(breadcrumbTree.id)}>
        {breadcrumbTree.label}
      </BreadcrumbPage>
    </BreadcrumbItem>
  );
};

const BreadcrumbTrail = ({
  baseURL,
  breadcrumbTree,
  setLocation,
}: BreadcrumbFactoryProps) => {
  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbBranch
          baseURL={baseURL}
          breadcrumbTree={breadcrumbTree}
          setLocation={setLocation}
        />
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbTrail;
