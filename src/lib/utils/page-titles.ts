/**
 * Utility function to get page title based on the current pathname
 */
export const getPageTitle = (pathname: string): string => {
  // Remove leading slash and split by '/'
  const pathSegments = pathname.replace(/^\//, '').split('/').filter(Boolean);
  
  if (pathSegments.length === 0) {
    return 'Dashboard';
  }

  const firstSegment = pathSegments[0];
  
  switch (firstSegment) {
    case 'jobs':
      if (pathSegments.length === 1) {
        return 'Jobs';
      }
      return 'Job Details';
    
    case 'candidates':
      if (pathSegments.length === 1) {
        return 'Candidates';
      }
      return 'Candidate Profile';
    
    case 'assessments':
      if (pathSegments.length === 1) {
        return 'Assessments';
      }
      if (pathSegments[1] === 'builder') {
        return 'Assessment Builder';
      }
      if (pathSegments[1] === 'demo') {
        return 'Assessment Demo';
      }
      return 'Assessments';
    
    default:
      // Capitalize first letter and return
      return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
  }
};
