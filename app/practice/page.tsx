import HomeDashboard from "../HomeDashboard";

// The account layout shows the guest landing screen when signed out.
export const instant = false;

export default function PracticePage() {
  return <HomeDashboard practiceOnly />;
}
