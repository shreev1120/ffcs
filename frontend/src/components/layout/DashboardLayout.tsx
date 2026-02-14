import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="flex flex-col min-h-screen relative overflow-hidden lg:pl-[280px]">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full -z-10" />

        <Header />

        <main className="flex-1 p-4 lg:p-10 max-w-[1400px] mx-auto w-full">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
