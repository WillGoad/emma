import { Prisma } from "@prisma/client";
import { Request } from "express";

type PrismaUser = Prisma.UserGetPayload<{}>;

// 2. Create a discriminated union type
type AuthUser =
  | ({ role: Exclude<PrismaUser['role'], 'GUEST'> } & PrismaUser) // Authenticated case
  | { role: 'GUEST' }; // Guest case

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export interface EmmaJWTPayload {
  id: string;
}

export interface KongDataProductDetails {
  serviceResponseBody: object | null;
  routeResponseBody: object | null;
}

export type DataProductWithKong = Prisma.DataProductGetPayload<{
  select: {
    id: true;
    name: true;
    accessURL: true;
    kongServiceID: true;
    price: true;
    pricingMode: true;
    currency: true;
    paymentInterval: true;
    organisationID: true;
    organisation: {
      select: {
        id: true;
        name: true;
        logoUrl: true;
        shortName: true;
      };
    };
  };
}> & {
  kongDetails: KongDataProductDetails | null;
};

export type Organisation = Prisma.OrganisationGetPayload<{
  select: { id: true; logoUrl: true; name: true };
}>;

export type PrivateDataProductWithOrganization = Prisma.DataProductGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    accessURL: true;
    kongServiceID: true;
    status: true;
    upstreamURL: true;
    price: true;
    organisationID: true;
    organisation: {
      select: {
        name: true;
        logoUrl: true;
        shortName: true;
      };
    };
  };
}>;

export type DataProductWithOrganization = Prisma.DataProductGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    price: true;
    organisationID: true;
    organisation: {
      select: {
        name: true;
        logoUrl: true;
      };
    };
  };
}>;

// Define type for the mapped response
export type MappedDataProduct = {
  objectID: string;
  dataproduct: string;
  description: string | null;
  price: number;
  organisation: string;
  organisationLogoUrl: string;
  organisationID: string;
};

export interface KeyAuth {
  id: string;
  key: string;
  ttl: number;
}
