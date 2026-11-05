import HomeDashboard from "./HomeDashboard";

// The root layout shows the guest landing screen instead of this segment after sign-out.
export const instant = false;

export default function HomePage() {
  return <HomeDashboard />;
}
