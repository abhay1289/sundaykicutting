import { BarberExperience } from "./components/BarberExperience";
import { barberPlace } from "./place";

export default function HomePage() {
  return <BarberExperience place={barberPlace} />;
}
