import HeroSection from '@/sections/HeroSection';
import SafetyStatusCard from '@/sections/SafetyStatusCard';
import CoursesCarousel from '@/sections/CoursesCarousel';
import CalculatorsGrid from '@/sections/CalculatorsGrid';
import ToolsCarousel from '@/sections/ToolsCarousel';
import SafetyReminder from '@/sections/SafetyReminder';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <SafetyStatusCard />
      <CoursesCarousel />
      <CalculatorsGrid />
      <ToolsCarousel />
      <SafetyReminder />
    </div>
  );
}
