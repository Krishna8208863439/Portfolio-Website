import Navbar from '@/components/navbar/Navbar';
import HeroSection from '@/components/hero/HeroSection';
import AboutSection from '@/components/about/AboutSection';
import SkillsSection from '@/components/skills/SkillsSection';
import ProjectsSection from '@/components/projects/ProjectsSection';
import EducationSection from '@/components/education/EducationSection';
import CertificatesSection from '@/components/certificates/CertificatesSection';
import ResumeSection from '@/components/resume/ResumeSection';
import ContactSection from '@/components/contact/ContactSection';
import Footer from '@/components/footer/Footer';

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <EducationSection />
      <CertificatesSection />
      <ResumeSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
