import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen font-sans bg-background text-foreground py-24 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="text-primary hover:underline font-medium text-sm">
          &larr; Back to Home
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the platform.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">2. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for all your activity on the platform. You agree not to use the platform for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction while using our service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">3. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content and features available on the platform, including but not limited to algorithms, visualizations, and text, are our property and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">4. Modifications to Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or discontinue, temporarily or permanently, the platform (or any part thereof) with or without notice at any time.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
