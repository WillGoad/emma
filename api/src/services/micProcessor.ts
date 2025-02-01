// import csvtojson from 'csvtojson'
// import { PrismaClient } from '@prisma/client';

// export const processISODataCSV = async (prisma: PrismaClient) => {
//     const isoexchangedata = await csvtojson().fromFile('ISO10383_MIC.csv');
//     console.log(isoexchangedata.length);

//     for (const exchangeData of isoexchangedata) {
//         const existingExchange = await prisma.iSO10383.findUnique({
//             where: {
//                 mic: exchangeData.MIC,
//             },
//         });
//         if (!existingExchange) {
//             const isoData = {
//                 data: {
//                     mic: exchangeData.MIC,
//                     operatingMic: exchangeData['OPERATING MIC'],
//                     oprtSgmt: exchangeData['OPRT/SGMT'],
//                     marketName: exchangeData['MARKET NAME-INSTITUTION DESCRIPTION'],
//                     ...(exchangeData['LEGAL ENTITY NAME'] ? { legalEntityName: exchangeData['LEGAL ENTITY NAME'] } : {}),
//                     ...(exchangeData.LEI ? { lei: exchangeData.LEI } : {}),
//                     marketCategoryCode: exchangeData['MARKET CATEGORY CODE'],
//                     ...(exchangeData.ACRONYM ? { acronym: exchangeData.ACRONYM } : {}),
//                     ...(exchangeData['ISO COUNTRY CODE (ISO 3166)'] ? { isoCountryCode: exchangeData['ISO COUNTRY CODE (ISO 3166)'] } : {}),
//                     ...(exchangeData.CITY ? { city: exchangeData.CITY } : {}),
//                     ...(exchangeData.WEBSITE ? { website: exchangeData.WEBSITE } : {}),
//                     status: exchangeData.STATUS,
//                     creationDate: exchangeData['CREATION DATE'],
//                     lastUpdateDate: exchangeData['LAST UPDATE DATE'],
//                     ...(exchangeData['LAST VALIDATION DATE'] ? { lastValidationDate: exchangeData['LAST VALIDATION DATE'] } : {}),
//                     ...(exchangeData['EXPIRY DATE'] ? { expiryDate: exchangeData['EXPIRY DATE'] } : {}),
//                     ...(exchangeData.COMMENTS ? { comments: exchangeData.COMMENTS } : {}),
//                 },
//             };
//             await prisma.iSO10383.create(isoData);
//         }
//         // const existingExchange2 = await prisma.exchange.findUnique({
//         //     where: {
//         //         mic: exchangeData.MIC,
//         //     },
//         // });
//         // if (!existingExchange2) {
//         //     const dataProduct = {
//         //         name: exchangeData.MIC + " ISO10383 Data",
//         //         description: "ISO10383 meta data",
//         //         isPaid: false,
//         //         url: "https://api.emmadata.org/" + exchangeData.MIC + "/ISO10383",
//         //     }
//         //     const exchange = {
//         //         data: {
//         //             mic: exchangeData.MIC,
//         //             operatingMic: exchangeData['OPERATING MIC'],
//         //             marketName: exchangeData['MARKET NAME-INSTITUTION DESCRIPTION'],
//         //             ...(exchangeData.ACRONYM ? { acronym: exchangeData.ACRONYM } : {}),
//         //             ...(exchangeData['ISO COUNTRY CODE (ISO 3166)'] ? { isoCountryCode: exchangeData['ISO COUNTRY CODE (ISO 3166)'] } : {}),
//         //             ...(exchangeData.CITY ? { city: exchangeData.CITY } : {}),
//         //             status: exchangeData.STATUS,
//         //             dataProducts: [dataProduct]
//         //         },
//         //     };
//         //     await prisma.exchange.create(exchange);
//         }
//     }

// }
