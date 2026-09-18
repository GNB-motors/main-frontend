/* Pulse-history shaping for the time scrubber. The service returns the
   buckets in whatever order the store produced them; the scrubber needs them
   chronological. Pure so the tolerance for missing payload shapes is testable
   without React. */

export const sortPulseBuckets = (data) =>
  [...(data?.data?.buckets || [])].sort(
    (a, b) => new Date(a.bucketStart) - new Date(b.bucketStart),
  );
