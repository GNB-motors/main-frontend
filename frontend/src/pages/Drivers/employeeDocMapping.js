/**
 * Turn the documents fetched for an employee into the Add/Edit page's document
 * state ({ driverLicense, panCard, aadharCard }), each with its preview URL and id.
 */
export function mapFetchedEmployeeDocs(fetchedDocs) {
  const updatedDocs = {
    driverLicense: {
      file: null,
      preview: null,
      imageUrl: null,
      name: '',
      documentId: null,
    },
    panCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
    aadharCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
  };

  if (Array.isArray(fetchedDocs)) {
    fetchedDocs.forEach((doc) => {
      // Map API doc types to our state keys
      const mappedType = {
        DRIVER_LICENSE: 'driverLicense',
        DL: 'driverLicense',
        LICENSE: 'driverLicense',
        PAN: 'panCard',
        AADHAAR: 'aadharCard',
        AADHAR: 'aadharCard',
      }[doc.docType];

      if (mappedType) {
        const url = doc.publicUrl || doc.file_url || doc.fileUrl || doc.url || doc.documentUrl;
        if (url) {
          updatedDocs[mappedType].preview = url;
          updatedDocs[mappedType].imageUrl = url;
          updatedDocs[mappedType].name = doc.originalName || doc.docType;
          updatedDocs[mappedType].documentId = doc._id || doc.id || null;
        }
      }
    });
  }
  return updatedDocs;
}
