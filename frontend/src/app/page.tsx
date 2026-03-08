import Sidebar from "@/components/Sidebar/Sidebar";
import Hero from "@/components/Hero/Hero";
import Countdown from "@/components/Countdown/Countdown";
import Couple from "@/components/Couple/Couple";
import Family from "@/components/Family/Family";
import Locations from "@/components/Locations/Locations";
import RSVP from "@/components/RSVP/RSVP";
import Footer from "@/components/Footer/Footer";
import MobileNav from "@/components/Navigation/MobileNav";

export default function Home() {
  return (
    <>
      {/* Mobile navigation - only visible on small screens */}
      <MobileNav />

      <div className="split-container">
        {/* Left sidebar - only visible on desktop */}
        <Sidebar />

        {/* Right content panel */}
        <main className="right-panel">
          <Hero />
          {/* Countdown only shown as section on mobile (sidebar has it on desktop) */}
          <div className="lg:hidden">
            <Countdown variant="section" />
          </div>
          <Couple />
          <Family />
          <Locations />
          <RSVP />
          <Footer />
        </main>
      </div>
    </>
  );
}
