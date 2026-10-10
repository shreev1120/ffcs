import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] mx-auto w-full lg:ml-[260px]">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardLayout;
